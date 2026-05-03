# --- THE INFISICAL GATEWAY ---

variable "infisical_client_id" {
  type      = string
  sensitive = true
}

variable "infisical_client_secret" {
  type      = string
  sensitive = true
}

variable "infisical_project_id" {
  type = string
}

# --- REMAINING BOOTSTRAP KEYS ---
variable "vercel_api_token" {
  type      = string
  sensitive = true
}





variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "cloudflare_account_id" {
  type      = string
  sensitive = true
}

variable "convex_cloud_url" {
  type = string
}



variable "spacelift_api_key_id" {
  type      = string
  sensitive = true
}

variable "spacelift_api_key_secret" {
  type      = string
  sensitive = true
}

variable "spacelift_api_endpoint" {
  type = string
}

variable "arcjet_api_key" {
  type      = string
  sensitive = true
}

variable "deepgram_api_key" {
  type      = string
  sensitive = true
}

variable "remotion_aws_access_key" {
  type      = string
  sensitive = true
}

variable "remotion_aws_secret_key" {
  type      = string
  sensitive = true
}

# Note: AI keys, Convex keys, and Redis keys are now PULLED from Infisical 
# and do not need to be defined here manually.
