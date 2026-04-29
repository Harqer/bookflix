terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    neon = {
      source  = "kisler/neon"
      version = "~> 0.1"
    }
    clerk = {
      source  = "clerk/clerk"
      version = "~> 0.1"
    }
    upstash = {
      source  = "upstash/upstash"
      version = "~> 1.0"
    }
    gitlab = {
      source  = "gitlabhq/gitlab"
      version = "~> 16.0"
    }
    github = {
      source  = "integrations/github"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    axiom = {
      source  = "axiomhq/axiom"
      version = "~> 0.1"
    }
    sentry = {
      source  = "jianyuan/sentry"
      version = "~> 0.1"
    }
    resend = {
      source  = "resend/resend"
      version = "~> 0.1"
    }
    stripe = {
      source  = "stripe/stripe"
      version = "~> 1.0"
    }
  }
}

provider "vercel" {
  api_token = var.vercel_api_token
}

provider "aws" {
  region     = var.aws_region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

provider "upstash" {
  email   = var.upstash_email
  api_key = var.upstash_api_key
}

provider "gitlab" {
  token = var.gitlab_token
}

provider "github" {
  token = var.github_token
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
resource "neon_project" "bookflix" {
  name = "bookflix-cinema"
  region_id = "aws-us-east-1"
}

resource "neon_database" "main" {
  project_id = neon_project.bookflix.id
  name       = "production"
  owner_name = "neondb_owner"
}

# --- Vercel Project ---
resource "vercel_project" "bookflix" {
  name      = "bookflix-production"
  framework = "nextjs"
  
  environment = [
    {
      key   = "CLERK_PUBLISHABLE_KEY"
      value = var.clerk_publishable_key
      type  = "encrypted"
      target = ["production", "preview", "development"]
    },
    {
      key   = "CLERK_SECRET_KEY"
      value = var.clerk_secret_key
      type  = "encrypted"
      target = ["production", "preview", "development"]
    },
    {
      key   = "DATABASE_URL"
      value = "postgresql://${neon_database.main.owner_name}@${neon_project.bookflix.database_host}/${neon_database.main.name}"
      type  = "encrypted"
      target = ["production", "preview", "development"]
    },
    {
      key   = "NVIDIA_API_KEY"
      value = var.nvidia_api_key
      type  = "encrypted"
      target = ["production", "preview", "development"]
    },
    {
      key   = "ANTHROPIC_API_KEY"
      value = var.anthropic_api_key
      type  = "encrypted"
      target = ["production", "preview", "development"]
    },
    {
      key   = "LANGSMITH_API_KEY"
      value = var.langsmith_api_key
      type  = "encrypted"
      target = ["production", "preview", "development"]
    },
    {
      key   = "LANGSMITH_PROJECT"
      value = "bookflix-production"
      type  = "plain"
      target = ["production", "preview", "development"]
    },
    {
      key   = "LANGSMITH_TRACING"
      value = "true"
      type  = "plain"
      target = ["production", "preview", "development"]
    },
    {
      key   = "AWS_S3_BUCKET"
      value = aws_s3_bucket.assets.id
      type  = "plain"
      target = ["production", "preview", "development"]
    }
  ]
}

# --- AWS Assets Bucket ---
resource "aws_s3_bucket" "assets" {
  bucket = "bookflix-assets-production"
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# --- Upstash Redis (Job Queue & Caching) ---
resource "upstash_redis_database" "cache" {
  database_name = "bookflix-cache"
  region        = "us-east-1"
  plan          = "free"
}

# --- GitLab Project & CI/CD Variables ---
resource "gitlab_project_variable" "anthropic_key" {
  project   = var.gitlab_project_id
  key       = "ANTHROPIC_API_KEY"
  value     = var.anthropic_api_key
  protected = true
  masked    = true
}

resource "gitlab_project_variable" "nvidia_key" {
  project   = var.gitlab_project_id
  key       = "NVIDIA_API_KEY"
  value     = var.nvidia_api_key
  protected = true
  masked    = true
}

# --- GitHub Repository & Mirroring ---
resource "github_repository" "bookflix" {
  name        = "bookflix-main"
  visibility  = "private"
  description = "2026 Sovereign Cinematic Studio"
}

# Setup Mirroring from GitHub to GitLab
resource "github_repository_webhook" "gitlab_sync" {
  repository = github_repository.bookflix.name
  configuration {
    url          = "https://gitlab.com/api/v4/projects/${var.gitlab_project_id}/mirror/pull"
    content_type = "json"
    secret       = var.github_webhook_secret
  }
  events = ["push"]
}

# --- Cloudflare R2 (Cinematic Storage) ---
resource "cloudflare_r2_bucket" "renders" {
  account_id = var.cloudflare_account_id
  name       = "bookflix-renders-production"
  location   = "ENAM"
}

# --- Stripe (Credit System) ---
resource "stripe_product" "credits" {
  name        = "Cinematic Production Credits"
  description = "Credits for high-fidelity AI rendering"
}

resource "stripe_price" "credits_50" {
  product     = stripe_product.credits.id
  unit_amount = 5000 # $50.00
  currency    = "usd"
  recurring {
    interval = "month"
  }
}

# --- Observability (Axiom & Sentry) ---
resource "axiom_dataset" "studio_logs" {
  name        = "bookflix-studio-audit"
  description = "High-fidelity cinematic production logs"
}

# --- Resend (Business Communication) ---
resource "resend_domain" "bookflix" {
  name   = "bookflix.com"
  region = "us-east-1"
}
