#!/bin/bash

# Exit on error
set -e

# Update system packages
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "Installing required packages..."
sudo apt install -y nodejs npm nginx git build-essential

# Install Node.js 20.x (if not already installed)
if ! command -v node &> /dev/null || [[ $(node -v) != v20* ]]; then
    echo "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install PM2 globally
echo "Installing PM2..."
sudo npm install -g pm2

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Clone repository (if not already done)
if [ ! -d "profevision" ]; then
    echo "Cloning repository..."
    git clone https://github.com/yourusername/profevision.git
fi

# Navigate to project directory
cd profevision

# Install dependencies with legacy peer deps
echo "Installing project dependencies..."
npm install --legacy-peer-deps

# Build the project
echo "Building the project..."
npm run build

# Configure PM2
echo "Configuring PM2..."
pm2 delete profevision || true
pm2 start npm --name "profevision" -- start -i -1 --time

# Save PM2 configuration
pm2 save

# Configure Nginx
echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/profevision << EOF
server {
    listen 80;
    server_name your_domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Performance optimizations
    client_max_body_size 10M;
    client_body_buffer_size 128k;
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 100 8k;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static file caching
    location /_next/static {
        alias /path/to/profevision/.next/static;
        expires 365d;
        access_log off;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/profevision /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable PM2 startup
sudo pm2 startup

# Setup log rotation for PM2
echo "Setting up log rotation..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

echo "Deployment completed successfully!" 