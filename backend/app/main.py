from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uuid
import logging
import time
from datetime import datetime

from . import schemas, helm, k8s_utils

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Urumi Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "service": "Urumi Orchestrator"}

@app.get("/stores", response_model=List[schemas.Store])
def list_stores():
    releases = helm.list_releases()
    store_names = k8s_utils.get_store_names()
    custom_domains = k8s_utils.get_store_custom_domains()
    stores = []
    for r in releases:
        store_id = r["name"]
        namespace = r["namespace"]
        
        backend_name = f"{store_id}-medusa-store-backend"
        storefront_name = f"{store_id}-medusa-store-storefront"
        
        status = k8s_utils.get_deployment_status(namespace, backend_name)
        
        if status == "Ready":
            sf_status = k8s_utils.get_deployment_status(namespace, storefront_name)
            if sf_status != "Ready":
                status = "Provisioning"
        
        if r["status"] == "failed":
            status = "Failed"
            
        created_at = r["updated"]
        try:
            dt_str = created_at.split(" +")[0]
            if "." in dt_str:
                main_part, frac_part = dt_str.split(".")
                dt_str = f"{main_part}.{frac_part[:6]}"
            
            dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S.%f")
            created_at = dt.isoformat()
        except Exception as e:
            logger.warning(f"Date parsing failed for {created_at}: {e}")
            pass

        c_domain = custom_domains.get(namespace)
        url = f"http://{c_domain}" if c_domain else helm.get_ingress_url(store_id)

        stores.append(schemas.Store(
            id=store_id,
            name=store_names.get(store_id, store_id),
            custom_domain=c_domain,
            status=status,
            url=url,
            created_at=created_at
        ))
    return stores

def provision_workflow(store_id: str, store_name: str, custom_domain: str = None):
    logger.info(f"Starting provisioning workflow for {store_id} ({store_name})")
    try:
        helm.install_store(store_id, custom_domain=custom_domain)
        
        # Annotate namespace with display name
        k8s_utils.annotate_namespace(store_id, "urumi.io/store-name", store_name)
        if custom_domain:
            k8s_utils.annotate_namespace(store_id, "urumi.io/custom-domain", custom_domain)
        
        logger.info(f"Waiting for seed job to complete for {store_id}...")
        key = None
        for i in range(60):
            time.sleep(5)
            key = k8s_utils.get_publishable_key(store_id)
            if key and key.startswith("pk_"):
                logger.info(f"Found publishable key for {store_id}: {key}")
                break
        
        if not key:
            logger.error(f"Timed out waiting for publishable key for {store_id}")
            return

        logger.info(f"Patching storefront for {store_id}...")
        k8s_utils.patch_storefront_key(store_id, store_id, key)
        logger.info(f"Provisioning workflow completed for {store_id}")

    except Exception as e:
        logger.error(f"Provisioning workflow failed for {store_id}: {e}")

@app.post("/stores", response_model=schemas.Store)
def create_store(store: schemas.StoreCreate, background_tasks: BackgroundTasks):
    store_id = f"store-{uuid.uuid4().hex[:8]}"
    
    background_tasks.add_task(provision_workflow, store_id, store.name, store.custom_domain)
    
    url = f"http://{store.custom_domain}" if store.custom_domain else helm.get_ingress_url(store_id)

    return schemas.Store(
        id=store_id,
        name=store.name,
        custom_domain=store.custom_domain,
        status="Provisioning",
        url=url,
        created_at=datetime.now().isoformat()
    )

@app.delete("/stores/{store_id}")
def delete_store(store_id: str, background_tasks: BackgroundTasks):
    background_tasks.add_task(helm.delete_store, store_id)
    return {"status": "Store deletion initiated"}
