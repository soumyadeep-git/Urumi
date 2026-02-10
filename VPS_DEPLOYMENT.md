# Production VPS Deployment Guide

This guide details how to deploy the Urumi Orchestrator on a VPS (e.g., AWS EC2, Google Cloud Compute, DigitalOcean Droplet) using **k3s**.

## 1. Infrastructure Setup

### 1.1 Provision a VPS
- **OS**: Ubuntu 22.04 LTS recommended.
- **Specs**: Minimum 2 vCPU, 4GB RAM (8GB recommended for multiple concurrent stores).
- **Ports**: Open 80, 443, 6443 (for kubectl access if needed), and 8000 (Orchestrator API).

### 1.2 Install k3s
Run the following on your VPS:
```bash
curl -sfL https://get.k3s.io | sh -
```

Check status:
```bash
sudo kubectl get nodes
```

### 1.3 Install Helm
```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

## 2. Deploy Orchestrator

For production, you should containerize the backend and frontend.

### 2.1 Build & Push Images
(Run on your local machine)
```bash
# Backend
docker build -t your-registry/urumi-backend:latest ./backend
docker push your-registry/urumi-backend:latest

# Frontend
docker build -t your-registry/urumi-frontend:latest ./frontend
docker push your-registry/urumi-frontend:latest
```

### 2.2 Run Orchestrator
You can run the orchestrator as a Pod in the cluster or as a systemd service outside. Running it inside gives it easy access to the cluster service account.

**Option A: Docker Compose (Simplest for single node)**
1. Install Docker on VPS.
2. Create `docker-compose.yml`:
   ```yaml
   version: '3'
   services:
     backend:
       image: your-registry/urumi-backend:latest
       network_mode: host # Access to localhost k3s api
       volumes:
         - /etc/rancher/k3s/k3s.yaml:/root/.kube/config
       environment:
         - KUBECONFIG=/root/.kube/config
     frontend:
       image: your-registry/urumi-frontend:latest
       ports:
         - "8080:80"
   ```

**Option B: Kubernetes Deployment**
Create a `deployment.yaml` for the orchestrator and apply it. Ensure it has a `ServiceAccount` with `ClusterRole` binding to manage Helm releases.

## 3. Configure Helm for Production

We use `values-prod.yaml` for production overrides.

### 3.1 Domain & Ingress
In `charts/medusa-store/values-prod.yaml`:

```yaml
global:
  domain: "your-vps-domain.com" # e.g. apps.urumi.ai

ingress:
  className: "traefik" # k3s uses Traefik by default
  tls:
    enabled: true
    clusterIssuer: "letsencrypt-prod"
```

## 4. Enable TLS (HTTPS)

### 4.1 Install cert-manager
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.3/cert-manager.yaml
```

### 4.2 Create ClusterIssuer
Create `cluster-issuer.yaml`:
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: traefik
```
Apply it: `kubectl apply -f cluster-issuer.yaml`

## 5. Using Custom Domains

The Dashboard now supports linking a custom domain (e.g., `shop.mybrand.com`) to a store.

1.  **User**: Points A Record of `shop.mybrand.com` to your VPS IP.
2.  **Dashboard**: Creates store with "Custom Domain" set to `shop.mybrand.com`.
3.  **System**:
    - Adds `shop.mybrand.com` to the Ingress rules.
    - If TLS is enabled, `cert-manager` attempts to provision a certificate for it via HTTP-01 challenge.

## 6. Storage

k3s comes with `local-path` provisioner by default, which stores data in `/var/lib/rancher/k3s/storage`. This works for single-node VPS.

For multi-node clusters, install **Longhorn**:
```bash
kubectl apply -f https://raw.githubusercontent.com/longhorn/longhorn/v1.5.3/deploy/longhorn.yaml
```
And update `values-prod.yaml`:
```yaml
postgresql:
  primary:
    persistence:
      storageClass: longhorn
```
