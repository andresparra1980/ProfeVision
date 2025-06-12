#!/bin/bash

# Exit on error
set -e

echo "Starting redeployment process..."

# Go up one directory (assuming you're one level down from project root)
cd ProfeVision

# Fetch and pull the latest changes from git
echo "Fetching latest changes..."
git fetch
git pull

# Install dependencies (using yarn with legacy peer deps)
echo "Installing dependencies..."
yarn install --legacy-peer-deps

# Build the application
echo "Building the application..."
yarn build

# Copy static files to nginx directory
echo "Updating static files..."
NEXT_DIR=$(pwd)/.next
sudo mkdir -p /var/www/profevision/_next/static
sudo rm -rf /var/www/profevision/_next/static/*
sudo cp -R $NEXT_DIR/static/* /var/www/profevision/_next/static/
sudo chown -R www-data:www-data /var/www/profevision/_next
sudo chmod -R 755 /var/www/profevision/_next

# Verify CSS files specifically
echo "Verifying CSS files..."
if [ -d "$NEXT_DIR/static/css" ] && [ "$(ls -A $NEXT_DIR/static/css)" ]; then
    echo "✅ CSS files found in build directory"
    echo "CSS files in build directory:"
    ls -la $NEXT_DIR/static/css
    
    echo "CSS files in nginx directory:"
    ls -la /var/www/profevision/_next/static/css || echo "⚠️ CSS directory not found in nginx path"
else
    echo "⚠️ Warning: No CSS files found in build directory"
fi

# Restart the application with PM2 in cluster mode
echo "Restarting application in PM2 cluster mode..."
pm2 delete profevision || true # Or delete by name
pm2 start ecosystem.config.js

# Save the new PM2 configuration
echo "Saving PM2 configuration..."
pm2 save

# Ensure PM2 startup is properly configured
echo "Configuring PM2 startup..."
pm2 unstartup systemd || true
pm2 startup systemd
# Note: You'll need to run the generated command manually the first time

# Verify PM2 startup status
echo "Verifying PM2 startup configuration..."
pm2 startup status

# Verify application is running
echo "Verifying application is running..."
sleep 5
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Application is running successfully!"
    echo "Current PM2 status:"
    pm2 status
else
    echo "⚠️ Warning: Application may not be running properly. Check logs with: pm2 logs profevision"
fi

echo "✨ Redeployment completed!"