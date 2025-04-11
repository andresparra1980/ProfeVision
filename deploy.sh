#!/bin/bash

# Exit on error
set -e

# Update system packages
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "Installing required packages..."
sudo apt install -y nodejs nginx git build-essential curl certbot python3-certbot-nginx

# Install Node.js 20.x (if not already installed)
if ! command -v node &> /dev/null || [[ $(node -v) != v20* ]]; then
    echo "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install Yarn globally
echo "Installing Yarn..."
if ! command -v yarn &> /dev/null; then
    npm install -g yarn
fi

# Install PM2 globally
echo "Installing PM2..."
yarn global add pm2

# Clean yarn cache
echo "Cleaning yarn cache..."
yarn cache clean

# Clone repository (if not already done)
if [ ! -d "profevision" ]; then
    echo "Cloning repository..."
    git clone https://github.com/yourusername/profevision.git
fi

# Navigate to project directory
cd profevision

# Install dependencies with legacy peer deps
echo "Installing project dependencies..."
yarn install --legacy-peer-deps

# Build the project
echo "Building the project..."
yarn build

# Configure and start the application with PM2
echo "Configuring PM2..."
pm2 delete profevision || true
pm2 start npm --name "profevision" -- start

# Check if the app is running
echo "Waiting for the application to start..."
counter=0
max_attempts=30
until $(curl --output /dev/null --silent --head --fail http://localhost:3000) || [ $counter -eq $max_attempts ]; do
    echo "Application not yet available, waiting..."
    sleep 5
    ((counter++))
done

if [ $counter -eq $max_attempts ]; then
    echo "Application failed to start within expected time!"
    echo "Checking PM2 logs:"
    pm2 logs profevision --lines 50
    echo "Checking system resources:"
    free -m
    df -h
    exit 1
fi

echo "Application started successfully!"

# Save PM2 configuration
pm2 save

# Get the absolute path for the .next directory
NEXT_DIR=$(pwd)/.next

# Create a directory for static files that Nginx can access
echo "Creating directory for static files..."
sudo mkdir -p /var/www/profevision/static
sudo rm -rf /var/www/profevision/static/*

# Copy static files to the new location with proper ownership
echo "Copying static files to Nginx-accessible location..."
sudo cp -R $NEXT_DIR/static/* /var/www/profevision/static/
sudo chown -R www-data:www-data /var/www/profevision/static
sudo chmod -R 755 /var/www/profevision/static

# Configure initial Nginx setup for HTTP
echo "Configuring initial Nginx setup..."
sudo tee /etc/nginx/sites-available/profevision << EOF
server {
    listen 80;
    listen [::]:80;
    server_name profevision.andresparra.co;
    
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

    # Increase timeouts
    proxy_connect_timeout 60s;
    proxy_read_timeout 60s;
    proxy_send_timeout 60s;

    # Static files
    location /_next/static/ {
        alias /var/www/profevision/static/;
        expires 365d;
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";
        
        # Ensure proper MIME types
        include /etc/nginx/mime.types;
        default_type application/octet-stream;
    }

    # Handle all other requests with the Next.js app
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
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/profevision /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check if Nginx user can access the static files
echo "Checking Nginx access to static files..."
if sudo -u www-data ls -la /var/www/profevision/static/ > /dev/null 2>&1; then
    echo "Nginx can access static files successfully!"
else
    echo "Warning: www-data (Nginx user) may not have access to static files"
    ls -la /var/www/profevision/static/
fi

# Setup Let's Encrypt SSL
echo "Setting up Let's Encrypt SSL..."
sudo certbot --nginx -d profevision.andresparra.co --non-interactive --agree-tos --email certbot@andresparra.co

# Manually create a more robust HTTPS configuration
echo "Creating robust HTTPS configuration..."
sudo tee /etc/nginx/sites-available/profevision << EOF
server {
    listen 80;
    listen [::]:80;
    server_name profevision.andresparra.co;
    
    # Redirect all HTTP requests to HTTPS
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name profevision.andresparra.co;
    
    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/profevision.andresparra.co/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/profevision.andresparra.co/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Performance optimizations
    client_max_body_size 10M;
    client_body_buffer_size 128k;
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 100 8k;

    # Increase timeouts
    proxy_connect_timeout 60s;
    proxy_read_timeout 60s;
    proxy_send_timeout 60s;

    # Static files
    location /_next/static/ {
        alias /var/www/profevision/static/;
        expires 365d;
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";
        
        # Ensure proper MIME types
        include /etc/nginx/mime.types;
        default_type application/octet-stream;
    }

    # Handle all other requests with the Next.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Ssl on;
    }
}
EOF

# Test updated Nginx configuration
sudo nginx -t

# Restart Nginx to apply changes
sudo systemctl restart nginx

# Verify HTTPS configuration
echo "Verifying HTTPS configuration..."
if command -v curl > /dev/null; then
    echo "Testing HTTPS connection (this might fail if DNS is not yet propagated):"
    curl -I -L --insecure https://profevision.andresparra.co || echo "HTTPS check failed, but deployment continues"
fi

# Add cron job to auto-renew certificates
echo "Setting up auto-renewal for SSL certificates..."
(crontab -l 2>/dev/null; echo "0 3 * * * sudo certbot renew --quiet") | crontab -

# Enable PM2 startup
sudo pm2 startup

# Setup log rotation for PM2
echo "Setting up log rotation..."
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true

echo "Verifying application is still running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "Application is running successfully!"
else
    echo "Warning: Application is not responding. Check logs with: pm2 logs profevision"
fi

echo "IMPORTANT: Make sure your DNS is properly configured to point to this server."
echo "If you're using Cloudflare or another CDN, ensure SSL/TLS encryption mode is set to 'Full' or 'Full (Strict)'."
echo "HTTPS should now be properly configured. Try accessing https://profevision.andresparra.co"
echo "Deployment completed successfully!" 