# Phase 3 — CI/CD (.github/workflows/deploy.yml)
On push to `main`: test → build web+api images → push to ECR (sha + latest) → ASG instance refresh → wait → smoke test ALB.
Auth via GitHub OIDC role (no long-lived AWS keys). **DoD:** green run visible in Actions.
