# CEA SE-490 — Three-Tier Cloud Deployment (Axon)

Problem statement: `CEA - Problem Statement.pdf`. Cloud: **AWS, ap-south-1 (Mumbai)**. IaC: **Terraform**.
Budget constraint: ~US$38 of credits → short-lived deployment, destroyed after evidence capture.

## Architecture (summary)
Internet → public ALB → **Web tier** (Nginx container, ASG, public subnets)
→ internal ALB → **App tier** (Node/Express container, ASG, private subnets)
→ **DB tier** (RDS PostgreSQL, isolated DB subnets). One NAT gateway for private egress.
Images in **ECR**; GitHub Actions (OIDC, no stored keys) builds, pushes and triggers an ASG instance refresh.
Secrets: RDS-managed secret in **Secrets Manager**. Extras: S3 (uploads/backups), CloudWatch logs+alarms, Terraform, cost estimate.

## Phases (executed in order; each has a doc with its Definition of Done)
| # | Doc | Goal |
|---|-----|------|
| 1 | 01-phase1-app-and-containers.md | API + DB schema, Dockerfiles, docker-compose, tests (local) |
| 2 | 02-phase2-terraform.md | VPC, SGs, ALBs, ASGs, RDS, ECR, S3, IAM, CloudWatch, budgets |
| 3 | 03-phase3-cicd.md | GitHub Actions: test → build → push → deploy |
| 4 | 04-phase4-deploy-verify.md | `terraform apply`, push, verify app in browser |
| 5 | 05-phase5-evidence.md | Playwright screenshots of AWS console + app + pipeline |
| 6 | 06-phase6-report.md | Architecture diagram, 4–6 page LaTeX report, NFR section |
| 7 | 07-phase7-teardown-cost.md | Cost estimate, `terraform destroy`, delete IAM key |

## Cost guardrails
Single NAT, t3.micro, db.t3.micro single-AZ, min 2/max 3 ASGs, budget alerts at $15/$30, destroy after capture.
