#!/bin/bash
set -e

CLUSTER_NAME="urumi-cluster"
REGISTRY_NAME="urumi-registry.localhost"
REGISTRY_PORT="5000"

# Check if k3d is installed
if ! command -v k3d &> /dev/null; then
    echo "k3d could not be found. Please install it."
    exit 1
fi

# Check if helm is installed
if ! command -v helm &> /dev/null; then
    echo "helm could not be found. Please install it."
    exit 1
fi

# Create registry if not exists
if ! k3d registry list | grep -q "$REGISTRY_NAME"; then
    k3d registry create "$REGISTRY_NAME" --port "$REGISTRY_PORT"
fi

# Create cluster if not exists
if ! k3d cluster list | grep -q "$CLUSTER_NAME"; then
    echo "Creating k3d cluster..."
    k3d cluster create "$CLUSTER_NAME" \
        --api-port 6550 \
        --servers 1 \
        --agents 1 \
        --port "80:80@loadbalancer" \
        --port "443:443@loadbalancer" \
        --registry-use "k3d-$REGISTRY_NAME:$REGISTRY_PORT" \
        --k3s-arg "--disable=traefik@server:0"
    
    echo "Waiting for cluster to be ready..."
    kubectl wait --for=condition=Ready nodes --all --timeout=60s
fi

# Install Nginx Ingress Controller
echo "Installing Nginx Ingress Controller..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer

echo "Cluster setup complete."
echo "Make sure to add '127.0.0.1 urumi.local' and '*.urumi.local' to your /etc/hosts (or use dnsmasq)"
