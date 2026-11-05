# One command to tear everything down and stop all charges:  .\scripts\down.ps1
param([string]$Profile = "cea")
$ErrorActionPreference = "Stop"
$env:AWS_PROFILE = $Profile
$env:AWS_REGION = "ap-south-1"
$root = Split-Path $PSScriptRoot -Parent

Push-Location "$root\infra\terraform"
terraform destroy -auto-approve -input=false
Pop-Location

Write-Host "Stack destroyed. Billing stops (the NAT gateway, ALBs, EC2 and RDS are gone). Bring it back any time with .\scripts\up.ps1" -ForegroundColor Green
