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
    },
    {
      key    = "DATABASE_URL"
      value  = var.database_url
      target = ["production"]
    }
  ]
}

# 2. Cloudflare R2: Cinematic Storage Atom
resource "cloudflare_r2_bucket" "production_renders" {
  account_id = var.cloudflare_account_id
  name       = "bookflix-renders-production"
  location   = "ENAM" # High-performance North America region
}

# 3. Neon Database: Relational Scale Atom
resource "neon_project" "production_db" {
  name      = "bookflix-production"
  region_id = "aws-us-east-1"
  
  # Autoscaling handled natively by Neon Serverless
}
