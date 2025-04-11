#!/bin/bash

# Exit on error
set -e

echo "Starting redeployment process..."

# Go up one directory (assuming you're one level down from project root)
cd ..

# Fetch and pull the latest changes from git
echo "Fetching latest changes..."
git fetch
git pull

# Update environment variables
echo "Updating environment variables..."
if [ -f ".env.local" ]; then
    # Update NEXT_PUBLIC_SITE_URL if exists
    if grep -q "NEXT_PUBLIC_SITE_URL" .env.local; then
        sed -i 's|NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=https://profevision.andresparra.co|g' .env.local
    else
        echo "NEXT_PUBLIC_SITE_URL=https://profevision.andresparra.co" >> .env.local
    fi
    
    # Update NEXT_PUBLIC_API_URL if exists
    if grep -q "NEXT_PUBLIC_API_URL" .env.local; then
        sed -i 's|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://profevision.andresparra.co|g' .env.local
    else
        echo "NEXT_PUBLIC_API_URL=https://profevision.andresparra.co" >> .env.local
    fi
else
    # Create .env.local from example if it doesn't exist
    echo "Creating .env.local file with production values..."
    cp .env.local.example .env.local
    sed -i 's|NEXT_PUBLIC_API_URL=http://localhost:3000|NEXT_PUBLIC_API_URL=https://profevision.andresparra.co|g' .env.local
    echo "NEXT_PUBLIC_SITE_URL=https://profevision.andresparra.co" >> .env.local
fi

# Make sure uploads directory exists
echo "Creating uploads directory if it doesn't exist..."
mkdir -p public/uploads/omr

# Install dependencies (using yarn with legacy peer deps)
echo "Installing dependencies..."
yarn install --legacy-peer-deps

# Build the application
echo "Building the application..."
yarn build

# Restart the application with PM2 in cluster mode
echo "Restarting application in PM2 cluster mode..."
pm2 delete profevision || true
pm2 start npm --name "profevision" -i -1 -- start

# Copy static files to nginx directory
echo "Updating static files..."
NEXT_DIR=$(pwd)/.next
sudo mkdir -p /var/www/profevision/static
sudo rm -rf /var/www/profevision/static/*
sudo cp -R $NEXT_DIR/static/* /var/www/profevision/static/
sudo chown -R www-data:www-data /var/www/profevision/static
sudo chmod -R 755 /var/www/profevision/static

# Make sure nginx can access uploaded files
echo "Ensuring uploaded files are accessible..."
sudo mkdir -p /var/www/profevision/uploads/omr
sudo cp -R public/uploads/omr/* /var/www/profevision/uploads/omr/ || true
sudo chown -R www-data:www-data /var/www/profevision/uploads
sudo chmod -R 755 /var/www/profevision/uploads

# Set up nginx configuration for uploaded files if it doesn't exist
if ! grep -q "location /uploads/" /etc/nginx/sites-available/profevision; then
    echo "Adding uploads location to nginx configuration..."
    sudo sed -i '/location \/ {/i \
    # Serve uploaded files directly\
    location /uploads/ {\
        alias /var/www/profevision/uploads/;\
        expires 1d;\
        add_header Cache-Control "public, max-age=86400";\
        add_header Access-Control-Allow-Origin "*";\
        add_header Access-Control-Allow-Methods "GET, OPTIONS";\
        add_header Access-Control-Allow-Headers "Content-Type";\
    }\
    ' /etc/nginx/sites-available/profevision
    
    # Reload nginx to apply changes
    sudo nginx -t && sudo systemctl reload nginx
fi

# Save PM2 configuration so it persists across server restarts
echo "Saving PM2 configuration..."
pm2 save

# Verify application is running
echo "Verifying application is running..."
sleep 5
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Application is running successfully!"
    echo "✅ Running in cluster mode with $(pm2 prettylist | grep -c "online") instances"
else
    echo "⚠️ Warning: Application may not be running properly. Check logs with: pm2 logs profevision"
fi

echo "✨ Redeployment completed!"
