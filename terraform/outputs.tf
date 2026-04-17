output "server_ip" {
  description = "Öffentliche IP des Servers"
  value       = hcloud_server.cocojambo.ipv4_address
}

output "frontend_url" {
  description = "Frontend URL"
  value       = "http://${hcloud_server.cocojambo.ipv4_address}"
}

output "couchdb_url" {
  description = "CouchDB URL"
  value       = "http://${hcloud_server.cocojambo.ipv4_address}:5984/_utils"
}

output "ssh" {
  description = "SSH Befehl"
  value       = "ssh root@${hcloud_server.cocojambo.ipv4_address}"
}
