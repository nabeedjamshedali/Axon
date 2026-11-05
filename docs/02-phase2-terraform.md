# Phase 2 — Terraform (infra/terraform)
VPC 10.0.0.0/16: 2 public, 2 private-app, 2 private-db subnets over 2 AZs; IGW; 1 NAT; route tables; S3 gateway endpoint.
SGs chain: ALB→web→internal-ALB→app→RDS (each only from the previous tier). ASGs with target tracking CPU scaling.
RDS PostgreSQL (managed secret), ECR repos, S3 bucket, IAM roles (least privilege), CloudWatch logs/alarms, AWS Budget, GitHub OIDC role.
**DoD:** `terraform validate` + `plan` clean; `apply` succeeds.
