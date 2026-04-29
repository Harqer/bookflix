# --- ENTERPRISE SECURITY: SENSITIVE VARIABLES ---
# No defaults allowed. Values must be provided via Terraform Cloud / Environment.

variable "neon_api_url" {
  type      = string
  sensitive = true
}

variable "clerk_publishable_key" {
  type      = string
  sensitive = true
}

variable "clerk_secret_key" {
  type      = string
  sensitive = true
}

variable "anthropic_api_key" {
  type      = string
  sensitive = true
}

variable "nvidia_api_key" {
  type      = string
  sensitive = true
}

variable "convex_api_key" {
  type      = string
  sensitive = true
}

variable "axiom_api_key" {
  type      = string
  sensitive = true
}

variable "sentry_api_key" {
  type      = string
  sensitive = true
}

variable "vercel_api_token" {
  type      = string
  sensitive = true
}

variable "aws_access_key" {
  type      = string
  sensitive = true
}

variable "aws_secret_key" {
  type      = string
  sensitive = true
}
