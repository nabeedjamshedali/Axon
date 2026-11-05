variable "region" {
  description = "AWS region (Mumbai is the closest region to Pakistan: lowest latency; prices are slightly above us-east-1)."
  type        = string
  default     = "ap-south-1"
}

variable "project" {
  type    = string
  default = "axon"
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "instance_type" {
  description = "EC2 type for web and app tiers (free-plan eligible)."
  type        = string
  default     = "t3.micro"
}

variable "asg_min" {
  type    = number
  default = 2
}

variable "asg_desired" {
  type    = number
  default = 2
}

variable "asg_max" {
  type    = number
  default = 3
}

variable "db_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "db_multi_az" {
  description = "Multi-AZ doubles RDS cost; off to fit the credit budget (see report, NFR limitations)."
  type        = bool
  default     = false
}

variable "github_repo" {
  description = "owner/name of the GitHub repository allowed to assume the CI/CD role via OIDC."
  type        = string
  default     = "nabeedjamshedali/Axon"
}

variable "github_repo_oidc_id" {
  description = "Immutable-ID form of the repository as it appears in GitHub OIDC subjects (owner@id/name@id)."
  type        = string
  default     = "nabeedjamshedali@211976180/Axon@1447093003"
}

variable "alert_email" {
  description = "Email for CloudWatch alarms and budget alerts. Leave empty to skip the subscriptions."
  type        = string
  default     = ""
}

variable "budget_limit_usd" {
  type    = number
  default = 38
}
