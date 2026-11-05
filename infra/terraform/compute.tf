data "aws_ssm_parameter" "al2023" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

# ===== Load balancers ===========================================================
resource "aws_lb" "public" {
  name               = "${local.name}-public-alb"
  load_balancer_type = "application"
  internal           = false
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
  idle_timeout       = 60
}

resource "aws_lb_target_group" "web" {
  name     = "${local.name}-web-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  deregistration_delay = 30
  health_check {
    path                = "/healthz"
    matcher             = "200"
    interval            = 15
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
  }
}

resource "aws_lb_listener" "public_http" {
  load_balancer_arn = aws_lb.public.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

resource "aws_lb" "internal" {
  name               = "${local.name}-internal-alb"
  load_balancer_type = "application"
  internal           = true
  security_groups    = [aws_security_group.alb_internal.id]
  subnets            = aws_subnet.app[*].id
}

resource "aws_lb_target_group" "app" {
  name     = "${local.name}-app-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  deregistration_delay = 30
  health_check {
    path                = "/healthz" # liveness only: a DB outage must not mark every instance unhealthy
    matcher             = "200"
    interval            = 15
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
  }
}

resource "aws_lb_listener" "internal_http" {
  load_balancer_arn = aws_lb.internal.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# ===== Launch templates =========================================================
locals {
  registry = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.region}.amazonaws.com"
}

resource "aws_launch_template" "web" {
  name_prefix            = "${local.name}-web-"
  image_id               = data.aws_ssm_parameter.al2023.value
  instance_type          = var.instance_type
  update_default_version = true
  vpc_security_group_ids = [aws_security_group.web.id]

  iam_instance_profile { name = aws_iam_instance_profile.web.name }

  metadata_options {
    http_tokens                 = "required" # IMDSv2 only
    http_put_response_hop_limit = 2
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 8
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }

  user_data = base64encode(templatefile("${path.module}/templates/web.sh.tftpl", {
    region       = var.region
    image        = "${local.registry}/${aws_ecr_repository.web.name}:latest"
    api_upstream = "${aws_lb.internal.dns_name}:80"
    dns_resolver = local.vpc_dns
    log_group    = aws_cloudwatch_log_group.web.name
  }))

  tag_specifications {
    resource_type = "instance"
    tags          = { Name = "${local.name}-web", Tier = "web" }
  }
}

resource "aws_launch_template" "app" {
  name_prefix            = "${local.name}-app-"
  image_id               = data.aws_ssm_parameter.al2023.value
  instance_type          = var.instance_type
  update_default_version = true
  vpc_security_group_ids = [aws_security_group.app.id]

  iam_instance_profile { name = aws_iam_instance_profile.app.name }

  metadata_options {
    http_tokens                 = "required"
    http_put_response_hop_limit = 2 # container -> IMDS (AWS SDK for S3) needs the extra hop
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 8
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }

  user_data = base64encode(templatefile("${path.module}/templates/app.sh.tftpl", {
    region     = var.region
    image      = "${local.registry}/${aws_ecr_repository.api.name}:latest"
    secret_arn = aws_db_instance.main.master_user_secret[0].secret_arn
    db_host    = aws_db_instance.main.address
    db_name    = aws_db_instance.main.db_name
    s3_bucket  = aws_s3_bucket.data.bucket
    log_group  = aws_cloudwatch_log_group.api.name
  }))

  tag_specifications {
    resource_type = "instance"
    tags          = { Name = "${local.name}-app", Tier = "app" }
  }
}

# ===== Auto Scaling groups ======================================================
resource "aws_autoscaling_group" "web" {
  name                      = "${local.name}-web-asg"
  min_size                  = var.asg_min
  desired_capacity          = var.asg_desired
  max_size                  = var.asg_max
  vpc_zone_identifier       = aws_subnet.web[*].id
  target_group_arns         = [aws_lb_target_group.web.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 600

  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
      instance_warmup        = 120
    }
  }

  tag {
    key                 = "Name"
    value               = "${local.name}-web"
    propagate_at_launch = true
  }

  lifecycle { ignore_changes = [desired_capacity] }
}

resource "aws_autoscaling_group" "app" {
  name                      = "${local.name}-app-asg"
  min_size                  = var.asg_min
  desired_capacity          = var.asg_desired
  max_size                  = var.asg_max
  vpc_zone_identifier       = aws_subnet.app[*].id
  target_group_arns         = [aws_lb_target_group.app.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 600

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
      instance_warmup        = 120
    }
  }

  tag {
    key                 = "Name"
    value               = "${local.name}-app"
    propagate_at_launch = true
  }

  lifecycle { ignore_changes = [desired_capacity] }
}

# Elasticity: scale out/in automatically to hold average CPU near 50%
resource "aws_autoscaling_policy" "web_cpu" {
  name                   = "${local.name}-web-cpu-target"
  autoscaling_group_name = aws_autoscaling_group.web.name
  policy_type            = "TargetTrackingScaling"
  target_tracking_configuration {
    predefined_metric_specification { predefined_metric_type = "ASGAverageCPUUtilization" }
    target_value = 50
  }
}

resource "aws_autoscaling_policy" "app_cpu" {
  name                   = "${local.name}-app-cpu-target"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "TargetTrackingScaling"
  target_tracking_configuration {
    predefined_metric_specification { predefined_metric_type = "ASGAverageCPUUtilization" }
    target_value = 50
  }
}
