#!/bin/bash

# Exit on error
set -e

echo "Fixing permissions for uploads directory..."

# Get username
USERNAME=$(whoami)
echo "Current user: $USERNAME"

# Get the application directory
APP_DIR="/home/$USERNAME/ProfeVision"
UPLOADS_DIR="$APP_DIR/public/uploads/omr"

# Create directory if it doesn't exist
sudo mkdir -p $UPLOADS_DIR

# Set ownership
sudo chown -R $USERNAME:$USERNAME $APP_DIR/public/uploads
sudo chmod -R 755 $APP_DIR/public/uploads

# Make uploads directory writable by the app
sudo chmod 777 $UPLOADS_DIR

# Create a temp directory with write permissions
sudo mkdir -p $UPLOADS_DIR/temp
sudo chmod 777 $UPLOADS_DIR/temp

echo "Permissions fixed successfully!"
echo "Uploads directory: $UPLOADS_DIR"
ls -la $UPLOADS_DIR

echo "Run this command if you still have permission issues:"
echo "sudo chmod -R 777 $UPLOADS_DIR" 