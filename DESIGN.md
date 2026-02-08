# System Design & Tradeoffs

## Architecture Choice
We chose a **Microservices-based Orchestration** pattern:
- **Orchestrator (Python/FastAPI)**: Decoupled from the stores. It manages the lifecycle of stores via Helm. Python was chosen for its rich ecosystem (kubernetes client, subprocess control) and ease of development.
- **Store Engine (MedusaJS)**: A headless commerce engine that provides flexibility. We deploy the Backend and Storefront as separate microservices within the same namespace.
- **Infrastructure (Kubernetes)**: Provides isolation (Namespaces), resource management (Quotas/Limits), and networking (Ingress).

## Isolation Strategy
- **Namespace-per-Store**: Each store gets its own Kubernetes Namespace (`store-<id>`). This ensures strong isolation of resources, secrets, and networking.
- **Database Isolation**: Each store gets its own PostgreSQL instance (via Helm dependency). While resource-intensive, it guarantees data isolation and prevents "noisy neighbor" issues at the DB level. In a high-density environment, we would use a shared Postgres cluster with per-tenant databases.

## Idempotency & Failure Handling
- **Helm Atomic**: We use `helm upgrade --install --atomic`. If a deployment fails, Helm rolls back automatically.
- **Reconciliation**: The Orchestrator can be restarted without losing state, as the "source of truth" is the Kubernetes cluster itself (Helm releases).
- **Cleanup**: `helm uninstall` coupled with Namespace deletion ensures all resources (PVCs, Secrets) are removed.

## Local vs Production
- **Ingress**: Locally we use `k3d`'s LoadBalancer + Nginx Ingress with `urumi.local`. In production, we'd use Nginx Ingress with a real LoadBalancer and `cert-manager` for TLS.
- **Storage**: Locally `local-path` provisioner. Production would use a persistent block storage (e.g., EBS, Longhorn).
- **Domains**: Production uses real DNS with wildcards (`*.urumi.ai`).

## Scalability
- **Horizontal Pod Autoscaling (HPA)**: Can be enabled for Storefront and Backend based on CPU/Memory.
- **Orchestrator**: Stateless and can be replicated.
- **Database**: PostgreSQL can be scaled vertically or replicated (Read Replicas) if needed, though per-store DB limits the need for massive shared DB scaling.

## Security Posture
- **Secrets**: Sensitive data (DB passwords) are stored in Kubernetes Secrets.
- **Network Policies**: By default, namespaces are isolated. We can enforce `NetworkPolicy` to deny cross-namespace traffic.
- **RBAC**: The Orchestrator runs with a ServiceAccount that has permissions to manage specific resources (Deployments, Services, Ingress, Namespaces).
