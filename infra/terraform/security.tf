# One security group per tier; each tier only accepts traffic from the tier in front of it.
#   Internet -> alb -> web -> alb_internal -> app -> db
# Rules are separate resources so the groups can reference each other without cycles.

resource "aws_security_group" "alb" {
  name        = "${local.name}-alb-sg"
  description = "Public ALB"
  vpc_id      = aws_vpc.main.id
  tags        = { Name = "${local.name}-alb-sg" }
}

resource "aws_security_group" "web" {
  name        = "${local.name}-web-sg"
  description = "Web tier instances"
  vpc_id      = aws_vpc.main.id
  tags        = { Name = "${local.name}-web-sg" }
}

resource "aws_security_group" "alb_internal" {
  name        = "${local.name}-internal-alb-sg"
  description = "Internal ALB in front of the app tier"
  vpc_id      = aws_vpc.main.id
  tags        = { Name = "${local.name}-internal-alb-sg" }
}

resource "aws_security_group" "app" {
  name        = "${local.name}-app-sg"
  description = "Application tier instances"
  vpc_id      = aws_vpc.main.id
  tags        = { Name = "${local.name}-app-sg" }
}

resource "aws_security_group" "db" {
  name        = "${local.name}-db-sg"
  description = "RDS PostgreSQL"
  vpc_id      = aws_vpc.main.id
  tags        = { Name = "${local.name}-db-sg" }
}

# ---- Public ALB ------------------------------------------------------------
resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  security_group_id = aws_security_group.alb.id
  description       = "HTTP from the internet"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_egress_rule" "alb_to_web" {
  security_group_id            = aws_security_group.alb.id
  description                  = "To web tier"
  ip_protocol                  = "tcp"
  from_port                    = 80
  to_port                      = 80
  referenced_security_group_id = aws_security_group.web.id
}

# ---- Web tier --------------------------------------------------------------
resource "aws_vpc_security_group_ingress_rule" "web_from_alb" {
  security_group_id            = aws_security_group.web.id
  description                  = "HTTP from public ALB only"
  ip_protocol                  = "tcp"
  from_port                    = 80
  to_port                      = 80
  referenced_security_group_id = aws_security_group.alb.id
}

resource "aws_vpc_security_group_egress_rule" "web_to_internal_alb" {
  security_group_id            = aws_security_group.web.id
  description                  = "API calls to internal ALB"
  ip_protocol                  = "tcp"
  from_port                    = 80
  to_port                      = 80
  referenced_security_group_id = aws_security_group.alb_internal.id
}

resource "aws_vpc_security_group_egress_rule" "web_https_out" {
  security_group_id = aws_security_group.web.id
  description       = "HTTPS egress via NAT (ECR, packages, CloudWatch, SSM)"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
}

# ---- Internal ALB ----------------------------------------------------------
resource "aws_vpc_security_group_ingress_rule" "ialb_from_web" {
  security_group_id            = aws_security_group.alb_internal.id
  description                  = "HTTP from web tier only"
  ip_protocol                  = "tcp"
  from_port                    = 80
  to_port                      = 80
  referenced_security_group_id = aws_security_group.web.id
}

resource "aws_vpc_security_group_egress_rule" "ialb_to_app" {
  security_group_id            = aws_security_group.alb_internal.id
  description                  = "To app tier"
  ip_protocol                  = "tcp"
  from_port                    = 3000
  to_port                      = 3000
  referenced_security_group_id = aws_security_group.app.id
}

# ---- App tier --------------------------------------------------------------
resource "aws_vpc_security_group_ingress_rule" "app_from_ialb" {
  security_group_id            = aws_security_group.app.id
  description                  = "API port from internal ALB only"
  ip_protocol                  = "tcp"
  from_port                    = 3000
  to_port                      = 3000
  referenced_security_group_id = aws_security_group.alb_internal.id
}

resource "aws_vpc_security_group_egress_rule" "app_to_db" {
  security_group_id            = aws_security_group.app.id
  description                  = "PostgreSQL to DB tier"
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  referenced_security_group_id = aws_security_group.db.id
}

resource "aws_vpc_security_group_egress_rule" "app_https_out" {
  security_group_id = aws_security_group.app.id
  description       = "HTTPS egress via NAT/S3 endpoint (ECR, Secrets Manager, S3, CloudWatch)"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
}

# ---- DB tier ---------------------------------------------------------------
resource "aws_vpc_security_group_ingress_rule" "db_from_app" {
  security_group_id            = aws_security_group.db.id
  description                  = "PostgreSQL from app tier only"
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  referenced_security_group_id = aws_security_group.app.id
}
