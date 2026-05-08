output "ecr_repository_url" {
  value       = aws_ecr_repository.app.repository_url
  description = "ECR image URI (without tag)"
}

output "ecs_cluster_name" {
  value       = aws_ecs_cluster.main.name
  description = "ECS cluster name for CI deploy"
}

output "ecs_service_name" {
  value       = aws_ecs_service.app.name
  description = "ECS service name for CI deploy"
}

output "ecs_task_definition_family" {
  value       = aws_ecs_task_definition.app.family
  description = "Task definition family for register-task-definition"
}

output "alb_dns_name" {
  value       = aws_lb.main.dns_name
  description = "ALB DNS — point Route53 or CNAME to this host"
}

output "database_endpoint" {
  value       = aws_db_instance.postgres.address
  description = "RDS hostname (private)"
  sensitive   = false
}
