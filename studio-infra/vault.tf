# --- THE SOVEREIGN VAULT: CROWN JEWEL MANAGEMENT ---
# This file manages high-privilege credentials in Infisical.
# Infisical serves as the Source of Truth, and secrets are synced to 
# other services (Spacelift, Vercel, etc.) as needed.

# 1. Cloudflare R2 Keys (Master Access)
resource "infisical_secret" "r2_access_key" {
  name         = "CLOUDFLARE_R2_ACCESS_KEY"
  value        = var.cloudflare_r2_access_key
  env_slug     = "prod"
  workspace_id = var.infisical_project_id
  folder_path  = "/"
}

resource "infisical_secret" "r2_secret_key" {
  name         = "CLOUDFLARE_R2_SECRET_KEY"
  value        = var.cloudflare_r2_secret_key
  env_slug     = "prod"
  workspace_id = var.infisical_project_id
  folder_path  = "/"
}

# 2. Vercel Blob Token (Write Access)
resource "infisical_secret" "vercel_blob_token" {
  name         = "BLOB_READ_WRITE_TOKEN"
  value        = var.vercel_blob_read_write_token
  env_slug     = "prod"
  workspace_id = var.infisical_project_id
  folder_path  = "/"
}

# 3. AWS Master Credentials
resource "infisical_secret" "aws_access_key" {
  name         = "AWS_ACCESS_KEY"
  value        = var.aws_access_key
  env_slug     = "prod"
  workspace_id = var.infisical_project_id
  folder_path  = "/"
}

resource "infisical_secret" "aws_secret_key" {
  name         = "AWS_SECRET_KEY"
  value        = var.aws_secret_key
  env_slug     = "prod"
  workspace_id = var.infisical_project_id
  folder_path  = "/"
}

# 4. Neon Database Master Key
resource "infisical_secret" "neon_api_key" {
  name         = "NEON_API_KEY"
  value        = var.neon_api_key
  env_slug     = "prod"
  workspace_id = var.infisical_project_id
  folder_path  = "/"
}
