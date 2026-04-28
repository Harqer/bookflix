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

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "clerk_publishable_key" {
  type      = string
  sensitive = true
}

variable "clerk_secret_key" {
  type      = string
  sensitive = true
}

variable "database_url" {
  type      = string
  sensitive = true
}

variable "redis_url" {
  type      = string
  sensitive = true
}
