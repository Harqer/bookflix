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
      source = "kisler/neon"
      version = "~> 0.1"
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
      value = var.database_url
      type  = "encrypted"
      target = ["production", "preview", "development"]
    },
    {
      key   = "REDIS_URL"
      value = var.redis_url
      type  = "encrypted"
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

# --- Neon Database ---
# Note: Neon provider might require manual setup or a specific token.
# Using variables for simplicity in this template.
