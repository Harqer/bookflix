# --- THE INFISICAL-SPACELIFT BRIDGE ---

# Pulling all secrets from the Infisical Vault
data "infisical_secrets" "studio" {
  env_slug   = "prod"
  workspace_id = var.infisical_project_id
}

# The Spacelift Context (Source of Truth for Orchestration)
resource "spacelift_context" "studio_secrets" {
  name        = "ai-cinematic-studio"
  description = "Unified vault fueled by Infisical"
}

# Automatically Syncing Infisical Secrets to Spacelift
# Millions-of-users scale: zero manual uploading
resource "spacelift_environment_variable" "studio_keys" {
  for_each   = { for s in data.infisical_secrets.studio.secrets : s.name => s.value }
  context_id = spacelift_context.studio_secrets.id
  name       = each.key
  value      = each.value
  write_only = true
}
