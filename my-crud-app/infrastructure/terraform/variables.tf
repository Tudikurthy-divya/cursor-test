variable "aws_region" {
  description = "AWS region (default ap-south-1)"
  type        = string
  default     = "ap-south-1"
}

variable "domain" {
  description = "Public hostname for the ALB / app (used in tags and outputs)"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN in the same region for HTTPS listener"
  type        = string
}

variable "db_password" {
  description = "RDS master password (also stored in SSM SecureString)"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret (stored in SSM SecureString)"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth client ID (stored in SSM SecureString)"
  type        = string
  sensitive   = true
}

variable "project_name" {
  type    = string
  default = "my-crud-app"
}
