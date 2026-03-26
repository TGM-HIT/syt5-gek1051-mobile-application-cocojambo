#!/bin/bash
# Initial setup script for Oracle Cloud VM (Ubuntu)
# Run this ONCE on a fresh VM: bash setup-oracle-vm.sh
set -euo pipefail

echo "=== Updating system ==="
sudo apt-get update && sudo apt-get upgrade -y

echo "=== Installing Docker ==="
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "=== Adding user to docker group ==="
sudo usermod -aG docker "$USER"

echo "=== Opening firewall ports ==="
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 5984 -j ACCEPT
sudo netfilter-persistent save

echo "=== Cloning repository ==="
git clone https://github.com/TGM-HIT/syt5-gek1051-mobile-application-cocojambo.git ~/cocojambo

echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. cd ~/cocojambo"
echo "  2. Copy .env.example to .env and fill in your CouchDB credentials"
echo "  3. Copy frontend/.env.example to frontend/.env and set VITE_COUCHDB_HOST to your VM's public IP"
echo "  4. Run: docker compose up -d --build"
echo "  5. Log out and back in (for docker group to take effect)"
