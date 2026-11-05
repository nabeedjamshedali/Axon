# Axon: three-tier web application on AWS (SE-490 CEA)

Axon product-studio website extended into a three-tier system and deployed on AWS (ap-south-1, Mumbai):

```
Users -> Public ALB -> Web tier (Nginx container, ASG) -> Internal ALB -> App tier (Node/Express container, ASG) -> RDS PostgreSQL
                         private subnets, 2 AZs                            private subnets, 2 AZs                    private, encrypted
```

Supporting services: ECR (images), Secrets Manager (DB credential), S3 (contact submissions), CloudWatch (logs, alarms, dashboard), AWS Budgets, GitHub Actions (OIDC, no stored AWS keys). Architecture diagram: [docs/architecture.drawio](docs/architecture.drawio). Report: [report/report.pdf](report/report.pdf), screenshots: [report/evidence.pdf](report/evidence.pdf).

## Repository layout

| Path | Contents |
|---|---|
| `src/`, `index.html` | Vite front end (static site) |
| `web/` | Web tier: Nginx image (`Dockerfile`, `default.conf.template`) |
| `api/` | Application tier: Node/Express API, tests, `Dockerfile` |
| `docker-compose.yml` | Local run of web, api and Postgres |
| `infra/terraform/` | All AWS infrastructure as code |
| `.github/workflows/deploy.yml` | CI/CD: test, build, push to ECR, rolling deploy, smoke test |
| `scripts/up.ps1`, `scripts/down.ps1` | One-command create / destroy of the whole stack |
| `docs/` | Phase plans and the architecture diagram |

## Run locally

```
docker compose up --build        # http://localhost:8080
```

## Bring the AWS stack up / down (one command each)

Prerequisites (once): Terraform, AWS CLI with a profile named `cea` (`aws configure --profile cea`), Docker Desktop running, and `infra/terraform/terraform.tfvars` containing `alert_email = "you@example.com"` (git-ignored).

```powershell
.\scripts\up.ps1      # ~15 min: Terraform apply, build + push images to ECR, waits until the site answers, prints the URL
.\scripts\down.ps1    # ~10 min: terraform destroy, billing stops
```

While up the stack costs roughly US$0.20/hour (NAT gateway, 2 ALBs, 4 t3.micro, db.t3.micro). The URL changes each time the stack is recreated; `up.ps1` prints it. GitHub Actions needs no changes after a recreate (same role and ASG names; it looks the ALB up at deploy time).

## CI/CD

Every push to `main` runs tests, builds both images, pushes `:<sha>` and `:latest` to ECR, starts a rolling instance refresh of both Auto Scaling groups, waits for it to finish and smoke-tests the public endpoint. AWS access uses GitHub OIDC (role `axon-github-deploy`), so no AWS keys are stored in GitHub.
