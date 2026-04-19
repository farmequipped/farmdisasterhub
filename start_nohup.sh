#!/bin/bash
set -e

# ── Config ────────────────────────────────────────────────
SAGE_DIR="/home/pi/sage"
LOG_DIR="$SAGE_DIR/server/logs"
SERVICE_DIR="/etc/systemd/system"
# ─────────────────────────────────────────────────────────

echo "→ Creating log directory..."
mkdir -p "$LOG_DIR"

echo "→ Copying service files..."
sudo cp sage-python.service "$SERVICE_DIR/sage-python.service"
sudo cp sage-node.service   "$SERVICE_DIR/sage-node.service"

echo "→ Reloading systemd daemon..."
sudo systemctl daemon-reload

echo "→ Enabling services (auto-start on boot)..."
sudo systemctl enable sage-python.service
sudo systemctl enable sage-node.service

echo "→ Starting services now..."
sudo systemctl start sage-python.service
sudo systemctl start sage-node.service

echo ""
echo "✓ Done. Service status:"
sudo systemctl status sage-python.service --no-pager
echo ""
sudo systemctl status sage-node.service --no-pager