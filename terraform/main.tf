# ── SSH Key ────────────────────────────────────────────────────
resource "hcloud_ssh_key" "default" {
  name       = "cocojambo-key"
  public_key = trimspace(file("~/.ssh/id_ed25519.pub"))
}

# ── Firewall ──────────────────────────────────────────────────
resource "hcloud_firewall" "cocojambo" {
  name = "cocojambo-firewall"

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    protocol   = "tcp"
    port       = "5984"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction  = "in"
    protocol   = "icmp"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}

# ── Server ────────────────────────────────────────────────────
resource "hcloud_server" "cocojambo" {
  name         = "cocojambo"
  server_type  = var.server_type
  image        = "ubuntu-24.04"
  location     = var.location
  ssh_keys     = [hcloud_ssh_key.default.id]
  firewall_ids = [hcloud_firewall.cocojambo.id]

  user_data = templatefile("${path.module}/cloud-init.yaml", {
    couchdb_user     = var.couchdb_user
    couchdb_password = var.couchdb_password
  })

  provisioner "remote-exec" {
    inline = ["cloud-init status --wait || true", "mkdir -p /opt/cocojambo/dist"]
    connection {
      type        = "ssh"
      user        = "root"
      private_key = file("~/.ssh/id_ed25519")
      host        = self.ipv4_address
      agent       = false
      timeout     = "10m"
    }
  }

  provisioner "file" {
    source      = "${path.module}/../frontend/dist/"
    destination = "/opt/cocojambo/dist"
    connection {
      type        = "ssh"
      user        = "root"
      private_key = file("~/.ssh/id_ed25519")
      host        = self.ipv4_address
      agent       = false
      timeout     = "10m"
    }
  }

  provisioner "remote-exec" {
    inline = ["cd /opt/cocojambo && docker compose up -d"]
    connection {
      type        = "ssh"
      user        = "root"
      private_key = file("~/.ssh/id_ed25519")
      host        = self.ipv4_address
      agent       = false
      timeout     = "10m"
    }
  }
}
