output "app_url" {
  description = "Public entry point (HTTP)."
  value       = "http://${aws_lb.public.dns_name}"
}

output "internal_alb_dns" {
  value = aws_lb.internal.dns_name
}

output "ecr_web_repository" {
  value = aws_ecr_repository.web.repository_url
}

output "ecr_api_repository" {
  value = aws_ecr_repository.api.repository_url
}

output "rds_endpoint" {
  value = aws_db_instance.main.address
}

output "db_secret_arn" {
  value = aws_db_instance.main.master_user_secret[0].secret_arn
}

output "s3_bucket" {
  value = aws_s3_bucket.data.bucket
}

output "github_deploy_role_arn" {
  description = "Set as repository variable AWS_ROLE_ARN for GitHub Actions."
  value       = aws_iam_role.github_deploy.arn
}

output "asg_names" {
  value = { web = aws_autoscaling_group.web.name, app = aws_autoscaling_group.app.name }
}

output "vpc_id" {
  value = aws_vpc.main.id
}
