#!/bin/bash
set -e

echo "Building Medusa Backend Image..."
docker build -t medusa-backend:latest ./templates/medusa-backend

echo "Building Medusa Storefront Image..."
docker build -t medusa-storefront:latest ./templates/medusa-storefront

if command -v k3d &> /dev/null; then
    echo "Importing images to k3d cluster 'urumi-cluster'..."
    k3d image import medusa-backend:latest -c urumi-cluster || echo "Cluster urumi-cluster not found, skipping import."
    k3d image import medusa-storefront:latest -c urumi-cluster || echo "Cluster urumi-cluster not found, skipping import."
else
    echo "k3d not found. Skipping image import."
fi

echo "Build complete."
