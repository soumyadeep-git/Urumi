#!/bin/bash
set -e

CLUSTER_NAME="urumi-cluster"

echo "Deleting k3d cluster '$CLUSTER_NAME'..."
k3d cluster delete "$CLUSTER_NAME" || echo "Cluster not found."

echo "Cleanup complete."
