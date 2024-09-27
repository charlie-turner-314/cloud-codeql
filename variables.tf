# variables.tf

variable "aws_region" {
  description = "The AWS region to deploy into"
  type        = string
  default     = "ap-southeast-2"  # Change if needed
}

variable "aws_profile" {
  description = "The AWS CLI profile to use"
  type        = string
}

variable "username" {
  description = "Your unique username to prevent naming conflicts"
  type        = string
}

variable "db_username" {
  description = "Database username"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "domain" {
  description = "The domain name for Route53"
  type        = string
  default     = "cab432.com"  
}

variable "subdomain" {
  description = "The subdomain to create"
  type        = string
  default     = "code-analysis"
}

variable "route53_zone_id" {
  description = "The Route53 Hosted Zone ID for your domain"
  type        = string
}

variable "ec2_key_pair" {
  description = "The name of the AWS Key Pair to use for the EC2 instance"
  type        = string
  default     = "n10752846"
}

variable "instance_type" {
  description = "The EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "db_instance_class" {
  description = "The RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "The allocated storage size for RDS (in GB)"
  type        = number
  default     = 20
}

variable "public_key_path" {
  description = "Path to your public SSH key (e.g., ~/.ssh/id_rsa.pub)"
  type        = string
  default     = "/Users/charlieturner/.ssh/n10752846.pem"
}

variable "your_ip" {
  description = "Your public IP address"
  type        = string
}

variable "subnet_id" {
  description = "The subnet ID for the EC2 instance"
  type        = string
}

variable "security_group_ids" {
  description = "The security group IDs for the EC2 instance"
  type        = list(string)
}

variable "iam_role_name" {
  description = "The name of the IAM Role for the EC2 instance"
  type        = string
}

variable "vpc_id" {
  description = "The VPC ID for the security group"
  type        = string
}

variable "rds_subnet_id" {
  description = "The subnet ID for the RDS instance"
  type        = string
}

variable "ecr_repository_name" {
  description = "The name of the ECR repository."
  type        = string
  default    = "ecr-n10752846"
}

variable "google_client_id" {
  description = "The Google OAuth client ID"
  type        = string
}

variable "google_client_secret" {
  description = "The Google OAuth client secret"
  type        = string
  sensitive   = true
}