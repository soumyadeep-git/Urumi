import subprocess
import json
import os
import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CHART_PATH = os.path.join(BASE_DIR, "charts", "medusa-store")

def run_command(cmd: List[str]) -> str:
    logger.info(f"Running command: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        logger.error(f"Command failed: {result.stderr}")
        raise Exception(f"Command failed: {result.stderr}")
    return result.stdout

def list_releases() -> List[Dict]:
    try:
        cmd = ["helm", "list", "--all-namespaces", "-o", "json"]
        output = run_command(cmd)
        releases = json.loads(output)
        return [r for r in releases if r.get("chart", "").startswith("medusa-store")]
    except Exception as e:
        logger.error(f"Failed to list releases: {e}")
        return []

def install_store(store_id: str):
    namespace = store_id
    cmd = [
        "helm", "upgrade", "--install", store_id, CHART_PATH,
        "--namespace", namespace,
        "--create-namespace",
        "--set", f"global.domain=127.0.0.1.nip.io"
    ]
    run_command(cmd)

def delete_store(store_id: str):
    namespace = store_id
    try:
        run_command(["helm", "uninstall", store_id, "--namespace", namespace])
    except Exception as e:
        logger.warning(f"Helm uninstall failed (maybe already gone): {e}")
    
    try:
        run_command(["kubectl", "delete", "namespace", namespace, "--wait=false"])
    except Exception as e:
        logger.warning(f"Namespace delete failed: {e}")

def get_ingress_url(store_id: str) -> str:
    return f"http://{store_id}.127.0.0.1.nip.io"
