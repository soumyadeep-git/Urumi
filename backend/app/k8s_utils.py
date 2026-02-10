from kubernetes import client, config
import logging

logger = logging.getLogger(__name__)

def get_k8s_client():
    try:
        config.load_incluster_config()
    except config.ConfigException:
        try:
            config.load_kube_config()
        except config.ConfigException:
            logger.warning("Could not load kube config")
            return None
    return client.AppsV1Api()

def get_deployment_status(namespace: str, name: str) -> str:
    api = get_k8s_client()
    if not api:
        return "Unknown"
    
    try:
        dep = api.read_namespaced_deployment(name, namespace)
        if dep.status.ready_replicas == dep.spec.replicas:
            return "Ready"
        return "Provisioning"
    except Exception as e:
        logger.debug(f"Error checking deployment {name} in {namespace}: {e}")
        return "Provisioning"

def annotate_namespace(namespace: str, key: str, value: str):
    try:
        config.load_kube_config()
    except:
        config.load_incluster_config()
    
    v1 = client.CoreV1Api()
    
    # Sanitize value slightly if needed, but annotations allow arbitrary strings
    body = {
        "metadata": {
            "annotations": {
                key: value
            }
        }
    }
    
    try:
        v1.patch_namespace(namespace, body)
        logger.info(f"Annotated namespace {namespace} with {key}={value}")
    except Exception as e:
        logger.error(f"Failed to annotate namespace {namespace}: {e}")

def get_store_names() -> dict:
    """Returns a dict mapping namespace -> store display name from annotations."""
    try:
        config.load_kube_config()
    except:
        try:
            config.load_incluster_config()
        except:
            return {}
            
    v1 = client.CoreV1Api()
    try:
        # We could filter by label if we added one, but for now just list all and check annotation
        namespaces = v1.list_namespace()
        names = {}
        for ns in namespaces.items:
            if ns.metadata.annotations and "urumi.io/store-name" in ns.metadata.annotations:
                names[ns.metadata.name] = ns.metadata.annotations["urumi.io/store-name"]
        return names
    except Exception as e:
        logger.error(f"Failed to list namespaces: {e}")
        return {}

def get_store_custom_domains() -> dict:
    """Returns a dict mapping namespace -> custom domain from annotations."""
    try:
        config.load_kube_config()
    except:
        try:
            config.load_incluster_config()
        except:
            return {}
            
    v1 = client.CoreV1Api()
    try:
        namespaces = v1.list_namespace()
        domains = {}
        for ns in namespaces.items:
            if ns.metadata.annotations and "urumi.io/custom-domain" in ns.metadata.annotations:
                domains[ns.metadata.name] = ns.metadata.annotations["urumi.io/custom-domain"]
        return domains
    except Exception as e:
        logger.error(f"Failed to list namespaces: {e}")
        return {}

def get_publishable_key(namespace: str) -> str:
    try:
        config.load_kube_config()
    except config.ConfigException:
        try:
            config.load_incluster_config()
        except:
            return None

    v1 = client.CoreV1Api()
    
    pods = v1.list_namespaced_pod(namespace, label_selector="app.kubernetes.io/name=postgresql")
    if not pods.items:
        return None
    postgres_pod = pods.items[0].metadata.name
    
    secret = v1.read_namespaced_secret(f"{namespace}-postgresql", namespace)
    import base64
    password = base64.b64decode(secret.data["postgres-password"]).decode("utf-8")
    
    from kubernetes.stream import stream
    
    exec_command = [
        "bash", "-c",
        f"PGPASSWORD='{password}' psql -U postgres -d medusa -t -c \"SELECT token FROM api_key WHERE type='publishable' LIMIT 1;\""
    ]
    
    resp = stream(v1.connect_get_namespaced_pod_exec,
                  postgres_pod,
                  namespace,
                  command=exec_command,
                  stderr=True, stdin=False,
                  stdout=True, tty=False)
    
    key = resp.strip()
    return key if key else None

def patch_storefront_key(namespace: str, release_name: str, key: str):
    apps_v1 = get_k8s_client()
    if not apps_v1:
        return

    deployment_name = f"{release_name}-medusa-store-storefront"
    
    patch = {
        "spec": {
            "template": {
                "spec": {
                    "containers": [
                        {
                            "name": "storefront",
                            "env": [
                                {
                                    "name": "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY",
                                    "value": key
                                }
                            ]
                        }
                    ]
                }
            }
        }
    }
    
    try:
        apps_v1.patch_namespaced_deployment(deployment_name, namespace, patch)
        logger.info(f"Patched storefront deployment in {namespace} with publishable key")
    except Exception as e:
        logger.error(f"Failed to patch storefront deployment: {e}")
