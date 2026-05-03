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
      source  = "terraform-community-providers/neon"
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

provider "spacelift" {
  api_key_endpoint = var.spacelift_api_endpoint
  api_key_id       = var.spacelift_api_key_id
  api_key_secret   = var.spacelift_api_key_secret
}
provider "vercel" {
  api_token = var.vercel_api_token
}
provider "aws" {
  region     = var.aws_region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}
provider "neon" {
  token = var.neon_api_key
}
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
