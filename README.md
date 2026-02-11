# Urumi - Kubernetes Store Orchestrator

A production-ready platform for provisioning isolated e-commerce stores on Kubernetes. Built with **FastAPI**, **React**, **Helm**, and **MedusaJS**.

![Dashboard Screenshot](./assets/dashboard-preview.png)

## 🚀 Features

- **Kubernetes-Native Provisioning**: Uses Helm to deploy MedusaJS (Backend + Storefront + Postgres + Redis) as isolated tenants.
- **Strong Isolation**: Each store runs in its own `Namespace` with `NetworkPolicies` and `ResourceQuotas`.
- **Zero-Touch Automation**: Automatic database migration, seeding, and API key injection. No manual steps required.
- **Production Ready**: Same Helm charts for Local (k3d) and Production (k3s/VPS).
- **Dynamic Ingress**: Automated DNS resolution using `nip.io` for local development and production.
- **Modern Dashboard**: React-based UI with optimistic updates, real-time status tracking, and 3D landing page.

## 🛠️ System Architecture

- **Orchestrator**: Python (FastAPI) service that wraps Helm CLI and `kubectl`. Manages the lifecycle of stores.
- **Dashboard**: React + Vite frontend for user interaction.
- **Infrastructure**:
  - **k3d/k3s**: Kubernetes distribution.
  - **Nginx Ingress**: Routing traffic to specific store namespaces based on host headers.
  - **Storage**: LocalPath (local) or Longhorn/EBS (prod) for Postgres persistence.

## 🏃‍♂️ Quick Start (Local)

### Prerequisites
- Docker & k3d
- Helm & kubectl
- Node.js & Yarn
- Python 3.10+

### 1. Start Kubernetes Cluster
```bash
k3d cluster create urumi-cluster --port "80:80@loadbalancer" --agents 1
```

### 2. Start the Orchestrator (Backend)
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.main
```
*Server runs on http://127.0.0.1:8000*

### 3. Start the Dashboard (Frontend)
```bash
cd frontend
npm install
npm run dev
```
*Dashboard runs on http://localhost:5173*

### 4. Create a Store
1. Open the Dashboard.
2. Click "New Store".
3. Enter a name (e.g., "nike").
4. Wait for provisioning (approx 2-3 mins for first pull, 30s subsequent).
5. Click "Open" to visit the store at `http://nike.127.0.0.1.nip.io`.

## 🌍 Production Setup (VPS / k3s)

1. **Install k3s**:
   ```bash
   curl -sfL https://get.k3s.io | sh -
   ```

2. **Deploy Orchestrator**:
   Build the Docker images for backend/frontend and deploy them using a separate Helm chart or `docker-compose`.

3. **Configure Domain**:
   Update `backend/app/helm.py` or pass `global.domain` via `values-prod.yaml` to match your real DNS (e.g., `*.urumi.ai`).

   ```yaml
   # charts/medusa-store/values-prod.yaml
   global:
     domain: "urumi.ai"
   ingress:
     className: "traefik" # k3s default
   ```

4. **SSL/TLS**:
   Install `cert-manager` and `ClusterIssuer`. The Ingress templates support TLS configuration.

## 🧪 Testing

- **Liveness**: Backend checks if pods are `Running`.
- **End-to-End**:
  1. Create Store -> Status changes to "Provisioning".
  2. Wait ~1 min -> Status changes to "Ready".
  3. Visit URL -> Medusa Storefront loads.
  4. Add to Cart -> Checkout -> Order Created.

## 🛡️ Security & Isolation

- **Network Policies**: Default deny-all ingress for store namespaces. Only allows traffic from Ingress Controller.
- **Resource Quotas**: Hard limits on CPU/Memory per tenant to prevent "noisy neighbor" issues.
- **Secrets**: Database credentials are auto-generated (in a real prod scenario, integrate with Vault/SealedSecrets).

## 📂 Deliverables

- `backend/`: FastAPI Orchestrator code.
- `frontend/`: React Dashboard code.
- `charts/`: Helm charts for Medusa store.
- `SYSTEM_DESIGN.md`: Detailed architectural decisions and tradeoffs.
