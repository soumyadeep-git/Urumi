# System Design & Tradeoffs

## 1. Architecture Choice: Kubernetes-Native Orchestration

We chose a **Kubernetes-Native** approach using **Helm** as the provisioning engine.

### Why Helm + Python Wrapper?
- **Standardization**: Helm is the industry standard for packaging K8s apps. It handles dependency management (Postgres/Redis) and templating elegantly.
- **Atomic Operations**: Helm releases are atomic. If a chart fails, we know exactly what state the release is in.
- **Code-as-Configuration**: The `values.yaml` acts as the single source of truth for a store's configuration.
- **Python (FastAPI)**: Python provides a robust `subprocess` interface to wrap Helm, and `kubernetes` python client for querying pod status/logs. It's easier to write complex logic (like "wait for database seed") in Python than inside a Helm hook.

### Alternatives Considered
- **Terraform**: Too slow for "user-facing" provisioning (minutes vs seconds). Better for infrastructure, not application tenants.
- **Custom Operator**: Ideally the "most K8s-native" way, but significantly higher engineering complexity for Round 1. Our Python Orchestrator effectively acts as an imperative Operator.

## 2. Multi-Tenancy & Isolation Strategy

We implemented a **Namespace-per-Tenant** model.

### Isolation Layers
1. **Namespace**: Hard boundary for resources.
2. **NetworkPolicy**: We apply a `NetworkPolicy` that denies all ingress traffic to the namespace *except* from the Ingress Controller. This prevents Store A's backend from talking to Store B's database.
3. **ResourceQuota**: Each namespace gets a hard quota (e.g., 4 CPU, 8Gi Mem). This prevents one runaway store from crashing the node.

### Tradeoffs
- **Cost**: Running a full Postgres + Redis stack per store is resource-heavy.
- **Optimization**: For Round 2/Prod, we would move to a **Shared Database** model (one Postgres cluster, multiple logical databases) to reduce overhead, or use a pooled SQL operator.

## 3. Idempotency & Failure Handling

- **Idempotency**: The `create_store` endpoint checks if a Helm release already exists. If it does, it treats it as an update (idempotent) or rejects it, preventing duplicate resources.
- **Recovery**: If the Orchestrator crashes, Kubernetes state remains. When the Orchestrator restarts, it simply queries `helm list` to rebuild its state. It is stateless.
- **Cleanup**: `helm uninstall` triggers a cascading delete of the Namespace, ensuring no orphaned PVCs or Secrets remain.

## 4. Production Readiness (Local vs Prod)

The system is designed to switch contexts via `values.yaml`:

| Component | Local (k3d) | Production (k3s/VPS) |
|-----------|-------------|----------------------|
| **Ingress** | `nginx` class, `nip.io` domain | `traefik` or `nginx`, Real DNS (`*.urumi.ai`) |
| **Storage** | `local-path` standard | `longhorn` or Cloud Block Storage (EBS) |
| **Database** | Containerized (StatefulSet) | Managed RDS (optional) or Operator-based |
| **TLS** | Disabled (HTTP) | Enabled (`cert-manager` + Let's Encrypt) |

## 5. Round 2 Readiness (Gen AI)

This architecture is built for **Agentic AI**:
- **API-First**: The AI agent simply needs to call `POST /stores` with a JSON payload.
- **Configuration Injection**: We can extend the API to accept `{ theme: "dark", products: [...] }`. The Orchestrator can inject these as Helm values or run a custom "AI Seeder" job to populate the database with generated content.
