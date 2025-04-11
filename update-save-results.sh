#!/bin/bash

# Exit on error
set -e

echo "Starting targeted update for save-results fixes..."

# Get the current user
USERNAME=$(whoami)
echo "Current user: $USERNAME"

# Update environment variables if needed
echo "Checking environment variables..."
if [ -f ".env.local" ]; then
    # Ensure NEXT_PUBLIC_SITE_URL is set
    if ! grep -q "NEXT_PUBLIC_SITE_URL" .env.local; then
        echo "NEXT_PUBLIC_SITE_URL=https://profevision.andresparra.co" >> .env.local
        echo "Added NEXT_PUBLIC_SITE_URL to .env.local"
    fi
fi

# Build the application
echo "Building the application..."
yarn build

# Restart just the application with PM2
echo "Restarting application..."
pm2 reload profevision || pm2 restart profevision || pm2 start npm --name "profevision" -i -1 -- start

# Save PM2 configuration
echo "Saving PM2 configuration..."
pm2 save

# Verify application is running
echo "Verifying application is running..."
sleep 5
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Application is running successfully!"
else
    echo "⚠️ Warning: Application may not be running properly. Check logs with: pm2 logs profevision"
fi

echo "✨ Update completed! The save-results functionality should now work properly."
echo "If you still experience issues, check the logs with: pm2 logs profevision" 