# One command to bring the whole stack up:  .\scripts\up.ps1
# Needs: Terraform, AWS CLI (profile "cea"), Docker Desktop running. Takes ~15 minutes; costs about $0.20/hour while up.
param([string]$Profile = "cea")
$ErrorActionPreference = "Stop"
$env:AWS_PROFILE = $Profile
$env:AWS_REGION = "ap-south-1"
$root = Split-Path $PSScriptRoot -Parent

Write-Host "==> 1/3 Terraform: creating VPC, ALBs, ASGs, RDS, ECR, S3, IAM, CloudWatch ..."
Push-Location "$root\infra\terraform"
terraform init -input=false
terraform apply -auto-approve -input=false
$web = terraform output -raw ecr_web_repository
$api = terraform output -raw ecr_api_repository
$url = terraform output -raw app_url
Pop-Location

Write-Host "==> 2/3 Building and pushing the container images to ECR (instances are already waiting for them) ..."
$sha = (git -C $root rev-parse --short=7 HEAD).Trim()
$registry = $web.Split("/")[0]
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin $registry
docker build -f "$root\web\Dockerfile" -t "${web}:$sha" -t "${web}:latest" $root
docker build --build-arg GIT_SHA=$sha -t "${api}:$sha" -t "${api}:latest" "$root\api"
foreach ($img in @($web, $api)) { docker push "${img}:$sha"; docker push "${img}:latest" }

Write-Host "==> 3/3 Waiting for the site to answer (instances pull the images and register with the ALBs) ..."
$ok = $false
for ($i = 1; $i -le 60 -and -not $ok; $i++) {
    try { $r = Invoke-WebRequest "$url/api/health" -UseBasicParsing -TimeoutSec 10; if ($r.StatusCode -eq 200) { $ok = $true } }
    catch { Start-Sleep -Seconds 20 }
}
if ($ok) { Write-Host "UP: $url" -ForegroundColor Green } else { Write-Host "Stack is created but the site is not answering yet: $url (give it a few more minutes)" -ForegroundColor Yellow }
Write-Host "GitHub Actions deploys keep working unchanged (same role and ASG names). Run .\scripts\down.ps1 when you are done to stop the charges."
