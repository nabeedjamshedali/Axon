terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.80, < 7.0"
    }
  }

  # NOTE: local state is used for this short-lived academic deployment.
  # Production would use an S3 backend with locking (documented in the report).
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project   = var.project
      ManagedBy = "terraform"
      Course    = "SE-490-CEA"
    }
  }
}
