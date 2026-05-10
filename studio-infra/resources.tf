# --- CLOUD ASSETS: MULTI-CLOUD RESOURCE LAYER ---

# 1. Vercel Frontend Deployment
resource "vercel_project" "studio" {
  name      = "bookflix-studio"
  framework = "nextjs"

  environment = [
    {
      key    = "NEXT_PUBLIC_CONVEX_URL"
      value  = var.convex_cloud_url
      target = ["production", "preview", "development"]
    }
  ]
}

# 2. Cloudflare R2: Cinematic Storage Atom
resource "cloudflare_r2_bucket" "production_renders" {
  account_id = var.cloudflare_account_id
  name       = "bookflix-renders-production"
  location   = "ENAM" # High-performance North America region
}

# 🏛️ R2 CUSTOM DOMAIN: Theatrical Asset Delivery
# Points assets.cinegraph.studio to your R2 bucket for high-speed streaming
resource "cloudflare_r2_bucket_domain" "assets_domain" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.production_renders.name
  domain      = "assets.cinegraph.studio"
  enabled     = true
}

# 🏛️ R2 CORS POLICY: Hardened for Production
resource "cloudflare_r2_cors_policy" "cinematic_access" {
  account_id = var.cloudflare_account_id
  bucket     = cloudflare_r2_bucket.production_renders.name
  
  cors_rule {
    allowed_origins = ["https://cinegraph.studio", "https://studio.cinegraph.studio"] 
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_headers = ["*"]
    expose_headers  = ["Content-Type", "Content-Length", "ETag"]
    max_age_seconds = 3600
  }
}

# 3. Sovereign DCC Endpoints: The "Network Cables"
# 🛰️ THE NEURAL RESERVOIR (MODEL WEIGHTS PV)
# 🏛️ THE SIPHON REGISTRY (CLOUDFLARE R2)
# This handles the 24-Siphon binary distribution using the user's existing R2 account.
resource "cloudflare_r2_bucket" "siphon_registry" {
  account_id = var.cloudflare_account_id
  name       = "bookflix"
  location   = "ENAM"
}

# This persistent volume stores the 200GB+ of Sovereign weights (RigGS, Cosmos, etc.)
resource "google_compute_disk" "neural_weights" {
  name  = "siphon-neural-weights"
  type  = "pd-ssd"
  zone  = "us-central1-a"
  size  = 500 # 🛡️ Expanded to 500GB for Future Model Expansion
}

resource "google_compute_resource_policy" "neural_snapshot" {
  name   = "siphon-neural-snapshot"
  region = "us-central1"
  snapshot_schedule_policy {
    schedule {
      daily_schedule {
        days_in_cycle = 1
        start_time    = "04:00"
      }
    }
  }
}

# These expose the private MCP servers to the LLMs via Arcjet-protected routes
resource "cloudflare_worker_route" "nuke_ingress" {
  zone_id     = var.cloudflare_zone_id
  pattern     = "nuke.cinegraph.studio/*"
  script_name = "arcjet-sovereign-proxy"
}

resource "cloudflare_worker_route" "blender_ingress" {
  zone_id     = var.cloudflare_zone_id
  pattern     = "blender.cinegraph.studio/*"
  script_name = "arcjet-sovereign-proxy"
}

resource "cloudflare_worker_route" "houdini_ingress" {
  zone_id     = var.cloudflare_zone_id
  pattern     = "houdini.cinegraph.studio/*"
  script_name = "arcjet-sovereign-proxy"
}

# 4. Service Discovery Metadata: Feeding the Orchestrator
resource "spacelift_context" "fleet_discovery" {
  name        = "DCC-Fleet-Discovery"
  description = "Dynamic URLs for the Sovereign Production Clusters"

  labels = ["production", "sovereign"]
}

resource "spacelift_environment_variable" "nuke_url" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "NUKE_CLUSTER_ENDPOINT"
  value      = "https://nuke.cinegraph.studio"
  write_only = false
}

resource "spacelift_environment_variable" "blender_url" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "BLENDER_CLUSTER_ENDPOINT"
  value      = "https://blender.cinegraph.studio"
  write_only = false
}

# Production Binary Siphons: Managed URLs for DCC Installers
resource "spacelift_environment_variable" "nuke_binary_url" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "NUKE_BINARY_URL"
  value      = "https://assets.cinegraph.studio/binaries/nuke_latest.run" # Production Path
  write_only = false
}

resource "spacelift_environment_variable" "houdini_binary_url" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "HOUDINI_BINARY_URL"
  value      = "https://assets.cinegraph.studio/binaries/houdini_latest.tar.gz" # Production Path
  write_only = false
}

resource "spacelift_environment_variable" "maya_binary_url" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "MAYA_BINARY_URL"
  value      = "https://assets.cinegraph.studio/binaries/maya_latest.tar.gz" # Production Path
  write_only = false
}

resource "spacelift_environment_variable" "golaem_binary_url" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "GOLAEM_BINARY_URL"
  value      = "https://assets.cinegraph.studio/binaries/golaem_latest.tar.gz" # Production Path
  write_only = false
}

resource "spacelift_environment_variable" "vray_binary_url" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "VRAY_BINARY_URL"
  value      = "https://assets.cinegraph.studio/binaries/vray_latest.tar.gz"
  write_only = false
}

resource "spacelift_environment_variable" "unreal_binary_url" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "UNREAL_BINARY_URL"
  value      = "https://assets.cinegraph.studio/binaries/unreal_latest.tar.gz"
  write_only = false
}

resource "spacelift_environment_variable" "unity_binary_url" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "UNITY_BINARY_URL"
  value      = "https://assets.cinegraph.studio/binaries/unity_latest.tar.gz"
  write_only = false
}

resource "spacelift_environment_variable" "sdxl_weight_url" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "SDXL_WEIGHT_URL"
  value      = "https://assets.cinegraph.studio/weights/sdxl_base.safetensors"
  write_only = false
}

resource "spacelift_environment_variable" "controlnet_weight_url" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "CONTROLNET_WEIGHT_URL"
  value      = "https://assets.cinegraph.studio/weights/controlnet_cinematic.safetensors"
  write_only = false
}

resource "spacelift_environment_variable" "audiocraft_weight_url" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "AUDIOCRAFT_WEIGHT_URL"
  value      = "https://assets.cinegraph.studio/weights/audiocraft_production.tar.gz"
  write_only = false
}

resource "spacelift_environment_variable" "ludus_plugin_url" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "LUDUS_PLUGIN_URL"
  value      = "https://assets.cinegraph.studio/plugins/ludus_v13.zip"
  write_only = false
}

resource "spacelift_environment_variable" "ip_adapter_weight_url" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "IP_ADAPTER_WEIGHT_URL"
  value      = "https://assets.cinegraph.studio/weights/ip_adapter_consistency.safetensors"
  write_only = false
}

resource "spacelift_environment_variable" "cosmos_weight_url" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "COSMOS_WEIGHT_URL"
  value      = "https://assets.cinegraph.studio/weights/cosmos_v2.5.tar.gz"
  write_only = false
}

resource "spacelift_environment_variable" "longcat_binary_url" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "LONGCAT_BINARY_URL"
  value      = "https://assets.cinegraph.studio/binaries/longcat_latest.tar.gz"
  write_only = false
}

resource "spacelift_environment_variable" "matrix3d_weight_url" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "MATRIX3D_WEIGHT_URL"
  value      = "https://assets.cinegraph.studio/weights/matrix3d_latest.tar.gz"
  write_only = false
}

resource "spacelift_environment_variable" "diffuman_weight_url" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "DIFFUMAN_WEIGHT_URL"
  value      = "https://assets.cinegraph.studio/weights/diffuman_latest.tar.gz"
  write_only = false
}

resource "spacelift_environment_variable" "trellis_weight_url" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "TRELLIS_WEIGHT_URL"
  value      = "https://assets.cinegraph.studio/weights/trellis_forge.tar.gz"
  write_only = false
}

resource "spacelift_environment_variable" "sana_weight_url" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "SANA_WEIGHT_URL"
  value      = "https://assets.cinegraph.studio/weights/sana_forge.tar.gz"
  write_only = false
}

resource "spacelift_environment_variable" "blender_binary_url" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "BLENDER_BINARY_URL"
  value      = "https://assets.cinegraph.studio/binaries/blender_4.2_linux.tar.xz"
  write_only = false
}

# --- 🏛️ SOVEREIGN LICENSE GATEWAY ---
# These variables allow the fleet to authorize against your private license servers.
# You will populate these in the Spacelift/Infisical UI.
resource "spacelift_environment_variable" "nuke_license" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "foundry_LICENSE"
  value      = "4101@your-license-server-ip" # Placeholder
  write_only = true
}

resource "spacelift_environment_variable" "houdini_license" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "SESI_LMARK_HOST"
  value      = "your-houdini-server-ip" # Placeholder
  write_only = true
}

resource "spacelift_environment_variable" "maya_license" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "ADSKFLEX_LICENSE_FILE"
  value      = "@your-maya-license-server" # Placeholder
  write_only = true
}

resource "spacelift_environment_variable" "unity_license" {
  context_id = spacelift_context.fleet_discovery.id
  name       = "UNITY_LICENSE_SERVER"
  value      = "your-unity-license-server" # Placeholder
  write_only = true
}


