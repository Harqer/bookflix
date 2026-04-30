terraform {
  required_version = ">= 1.6.0"

  required_providers {
    infisical = {
      source  = "infisical/infisical"
      version = "~> 0.1"
    }
    spacelift = {
      source  = "spacelift-io/spacelift"
      version = "~> 1.0"
    }
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
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# --- INFISICAL: THE SOVEREIGN VAULT ---
provider "infisical" {
  host          = "https://app.infisical.com"
  client_id     = var.infisical_client_id
  client_secret = var.infisical_client_secret
}

provider "spacelift" {}
provider "vercel" {
  api_token = var.vercel_api_token
}
provider "aws" {
  region     = var.aws_region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}
provider "neon" {
  api_key = var.neon_api_key
}
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
