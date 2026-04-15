variable "hcloud_token" {
  description = "Hetzner Cloud API Token"
  type        = string
  sensitive   = true
}

variable "server_type" {
  description = "Hetzner Server-Typ"
  type        = string
  default     = "cx23"
}

variable "location" {
  description = "Rechenzentrum"
  type        = string
  default     = "nbg1"
}

variable "couchdb_user" {
  description = "CouchDB Admin Username"
  type        = string
  default     = "simon"
}

variable "couchdb_password" {
  description = "CouchDB Admin Passwort"
  type        = string
  sensitive   = true
  default     = "simon"
}
