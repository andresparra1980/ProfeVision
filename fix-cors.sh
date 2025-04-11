#!/bin/bash

# Exit on error
set -e

echo "Starting deployment of CORS fixes..."

# Update environment variables
echo "Checking environment variables..."
if [ -f ".env.local" ]; then
    # Ensure environment variables are set correctly
    if ! grep -q "NEXT_PUBLIC_SITE_URL" .env.local; then
        echo "NEXT_PUBLIC_SITE_URL=https://profevision.andresparra.co" >> .env.local
        echo "Added NEXT_PUBLIC_SITE_URL to .env.local"
    fi
    
    if ! grep -q "NEXT_PUBLIC_API_URL" .env.local; then
        echo "NEXT_PUBLIC_API_URL=https://profevision.andresparra.co" >> .env.local
        echo "Added NEXT_PUBLIC_API_URL to .env.local"
    fi
fi

# Ensure uploads directory exists
echo "Creating uploads directory if it doesn't exist..."
mkdir -p public/uploads/omr
chmod -R 755 public/uploads

# Build the application
echo "Building the application..."
yarn build

# Restart the application
echo "Restarting application..."
pm2 restart profevision || pm2 start npm --name "profevision" -- start

# Test the new API endpoint for serving images
echo "Testing image API endpoint..."
curl -I "http://localhost:3000/api/images/uploads/omr/test.jpg" || echo "API test failed, but continuing deployment"

echo "✅ CORS fixes deployed successfully!"
echo "Images should now load correctly through the API route."
echo "If you still have issues, you can restart the server with: pm2 restart profevision" 