#!/bin/bash
# ProfeVision LaTeX Service - systemd Installation Script
# This script sets up automatic start of the LaTeX service on server boot

set -e  # Exit on error

echo "==========================================="
echo "ProfeVision LaTeX Service Installer"
echo "==========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Error: This script must be run as root (use sudo)"
    exit 1
fi

# Get the actual user (not root)
if [ -n "$SUDO_USER" ]; then
    ACTUAL_USER=$SUDO_USER
    ACTUAL_HOME=$(eval echo ~$SUDO_USER)
else
    echo "❌ Error: Please run with sudo, not as root directly"
    exit 1
fi

echo "👤 Installing for user: $ACTUAL_USER"
echo "📁 Home directory: $ACTUAL_HOME"
echo ""

# Detect project directory
PROJECT_DIR="$ACTUAL_HOME/profevision"
SERVICE_DIR="$PROJECT_DIR/latex-service"

if [ ! -d "$SERVICE_DIR" ]; then
    echo "❌ Error: Directory $SERVICE_DIR not found"
    echo "   Make sure the project is cloned to $PROJECT_DIR"
    exit 1
fi

echo "✅ Found project at: $PROJECT_DIR"
echo ""

# Create systemd service file
SERVICE_FILE="/etc/systemd/system/profevision-latex.service"
echo "📝 Creating systemd service file..."

cat > "$SERVICE_FILE" << EOF
[Unit]
Description=ProfeVision LaTeX Service (Docker Compose)
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
User=$ACTUAL_USER
WorkingDirectory=$SERVICE_DIR
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

# Restart on failure
Restart=on-failure
RestartSec=10s

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Service file created: $SERVICE_FILE"
echo ""

# Check if .env exists
if [ ! -f "$SERVICE_DIR/.env" ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Creating from .env.example..."

    if [ -f "$SERVICE_DIR/.env.example" ]; then
        cp "$SERVICE_DIR/.env.example" "$SERVICE_DIR/.env"
        chown $ACTUAL_USER:$ACTUAL_USER "$SERVICE_DIR/.env"
        echo "✅ .env created from example"
        echo "   ⚠️  IMPORTANT: Edit $SERVICE_DIR/.env with your values!"
    else
        echo "❌ Error: .env.example not found either"
        exit 1
    fi
    echo ""
fi

# Reload systemd daemon
echo "🔄 Reloading systemd daemon..."
systemctl daemon-reload
echo "✅ Daemon reloaded"
echo ""

# Enable service to start on boot
echo "🚀 Enabling auto-start on boot..."
systemctl enable profevision-latex.service
echo "✅ Auto-start enabled"
echo ""

# Start the service now
echo "▶️  Starting service..."
systemctl start profevision-latex.service
echo "✅ Service started"
echo ""

# Check status
echo "📊 Service status:"
systemctl status profevision-latex.service --no-pager || true
echo ""

echo "==========================================="
echo "✅ Installation complete!"
echo "==========================================="
echo ""
echo "📌 Useful commands:"
echo "   sudo systemctl status profevision-latex     # Check status"
echo "   sudo systemctl restart profevision-latex    # Restart service"
echo "   sudo systemctl stop profevision-latex       # Stop service"
echo "   sudo systemctl start profevision-latex      # Start service"
echo "   sudo journalctl -u profevision-latex -f     # View logs"
echo ""
echo "📝 Next steps:"
echo "   1. Edit $SERVICE_DIR/.env with your API key"
echo "   2. Restart: sudo systemctl restart profevision-latex"
echo "   3. Test: curl http://localhost:8001/health"
echo ""
