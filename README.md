# Urumi Store Orchestration

## Prerequisites
- Docker
- k3d
- Helm
- Python 3.10+
- Node.js 18+

## Local Setup

1. **Setup Cluster**:
   ```bash
   ./scripts/setup_k3d.sh
   ```

2. **Build Images**:
   ```bash
   ./scripts/build_images.sh
   ```
   *Note: This builds Medusa Backend/Storefront and imports them into k3d.*

3. **Install Dependencies**:
   ```bash
   # Backend
   cd backend
   pip install -r requirements.txt
   
   # Frontend
   cd ../frontend
   npm install
   ```

4. **Start Services**:
   ```bash
   # Terminal 1: Orchestrator
   cd backend/app
   uvicorn main:app --reload --port 8000
   
   # Terminal 2: Dashboard
   cd frontend
   npm run dev
   ```

## Usage

1. Open Dashboard at `http://localhost:5173`.
2. Click "Create Store".
3. Wait for status to become "Ready" (polling every 5s).
4. Click "Open Store" to view the storefront (mapped to `store-id.urumi.local`).

**Important**: Add `127.0.0.1 *.urumi.local` to your `/etc/hosts`.

## Deployment to VPS (Production)

1. **Cluster**: Ensure `k3s` is running.
2. **Ingress**: Install Nginx Ingress.
3. **DNS**: Point `*.yourdomain.com` to VPS IP.
4. **Deploy Store**:
   The Orchestrator can run in-cluster or externally. Configure `values-prod.yaml` with your domain.
   
   To deploy a store manually for testing:
   ```bash
   helm install my-store ./charts/medusa-store -f ./charts/medusa-store/values-prod.yaml --namespace store-prod --create-namespace
   ```
