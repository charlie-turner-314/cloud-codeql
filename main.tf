# main.tf

# Provider configuration
provider "aws" {
  region = var.aws_region
  profile = var.aws_profile
}

# Load your SSH key
resource "tls_private_key" "ssh_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}


# S3 Bucket for analysis results
resource "aws_s3_bucket" "analysis_results" {
  bucket = "${var.username}-code-analysis-results"

  tags = {
    Name            = "Code Analysis Results Bucket"
    Environment     = "Development"
    purpose         = "assessment2"
    qut-username    = "n10752846@qut.edu.au"
  }
}

# Security Group for Database
resource "aws_security_group" "main" {
  vpc_id = var.vpc_id

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    security_groups = var.security_group_ids
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "main-security-group"
  }
}

data "aws_vpc" "selected" {
    id = var.vpc_id
}

 
data "aws_subnet" "main" {
    id = var.rds_subnet_id
}


resource "aws_db_subnet_group" "main" {
  name       = "main-subnet-group"
  subnet_ids = [data.aws_subnet.main.id, var.subnet_id]

  tags = {
    Name = "n10752846-subnet-group"
    qut-username = "n10752846@qut.edu.au"
    purpose = "assessment-2"
  }
}

# RDS Instance for metadata
resource "aws_db_instance" "metadata_db" {
  allocated_storage      = 10
  engine                 = "mysql"
  instance_class         = "db.t3.micro"
  db_name                = "n10752846db"
  username               = var.db_username
  password               = var.db_password
  parameter_group_name   = "default.mysql8.0"
  skip_final_snapshot    = true
  publicly_accessible    = false
  vpc_security_group_ids = concat([aws_security_group.main.id], var.security_group_ids)
  db_subnet_group_name   = aws_db_subnet_group.main.name


  tags = {
    purpose         = "assessment-2"
    qut-username    = "n10752846@qut.edu.au"
  }
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners = ["amazon"]

  filter {
    name = "name"
    values = ["amzn2-ami-hvm-*-x86_64-ebs"]
  }
}

# EC2 Instance for your application server
resource "aws_instance" "app_instance" {
  ami                         = data.aws_ami.amazon_linux.id
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_id
  vpc_security_group_ids      = var.security_group_ids 
  key_name                    = var.ec2_key_pair
  iam_instance_profile        = var.iam_role_name

  depends_on = [aws_db_instance.metadata_db]

  # don't update tags on apply
  lifecycle {
    ignore_changes = [tags]
  }

  # Include the shell script in user_data
  user_data = <<-EOF
    #!/bin/bash

    # Update package index
    echo "Updating system packages..."
    sudo yum update -y

    # Install MySQL client
    echo "Installing MySQL client..."
    sudo yum install -y mysql

    # Install jq for JSON parsing
    echo "Installing jq..."
    sudo yum install -y jq

    # Install AWS CLI if not already installed
    if ! command -v aws &> /dev/null
    then
        echo "Installing AWS CLI..."
        sudo yum install -y aws-cli
    fi

    # Retrieve database credentials from AWS Secrets Manager
    SECRET_NAME="${aws_secretsmanager_secret.db_credentials.name}"
    REGION="${var.aws_region}"

    echo "Retrieving database credentials from AWS Secrets Manager..."
    DB_SECRET=$(aws secretsmanager get-secret-value --secret-id $${SECRET_NAME} --region $${REGION} --query SecretString --output text)

    if [ -z "$${DB_SECRET}" ]; then
        echo "Failed to retrieve database credentials."
        exit 1
    fi

    DB_USERNAME=$(echo $${DB_SECRET} | jq -r .username)
    DB_PASSWORD=$(echo $${DB_SECRET} | jq -r .password)
    DB_HOST=$(echo $${DB_SECRET} | jq -r .host)
    DB_PORT=$(echo $${DB_SECRET} | jq -r .port)
    DB_NAME=$(echo $${DB_SECRET} | jq -r .dbname)

    # Test MySQL connectivity
    echo "Testing MySQL connectivity..."
    mysql -h $${DB_HOST} -P $${DB_PORT} -u $${DB_USERNAME} -p$${DB_PASSWORD} -e "SHOW DATABASES;" &> /dev/null

    if [ $? -eq 0 ]; then
        echo "Successfully connected to the MySQL database."
    else
        echo "Failed to connect to the MySQL database."
        exit 1
    fi

    # Install Docker
    echo "Installing Docker..."
    sudo amazon-linux-extras install docker -y
    sudo service docker start
    sudo usermod -a -G docker ec2-user

    # Enable Docker to start on boot
    sudo systemctl enable docker

    # Install Node.js
    echo "Installing Node.js..."
    curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs

    # Retrieve application configuration from Parameter Store
    echo "Retrieving application configuration from Parameter Store..."
    REGION="${var.aws_region}"
    APP_CONFIG=$(aws ssm get-parameter --name "/code-analysis/app-config" --region "$${REGION}" --query "Parameter.Value" --output text)

    if [ -z "$${APP_CONFIG}" ]; then
      echo "Failed to retrieve application configuration."
      exit 1
    fi

    # Parse the JSON configuration
    AWS_REGION=$(echo "$${APP_CONFIG}" | jq -r .AWS_REGION)
    COGNITO_USER_POOL_ID=$(echo "$${APP_CONFIG}" | jq -r .COGNITO_USER_POOL_ID)
    COGNITO_APP_CLIENT_ID=$(echo "$${APP_CONFIG}" | jq -r .COGNITO_APP_CLIENT_ID)
    COGNITO_DOMAIN=$(echo "$${APP_CONFIG}" | jq -r .COGNITO_DOMAIN)
    S3_BUCKET_NAME=$(echo "$${APP_CONFIG}" | jq -r .S3_BUCKET_NAME)
    DB_SECRET_NAME=$(echo "$${APP_CONFIG}" | jq -r .DB_SECRET_NAME)

    # Pull Docker image from ECR (assuming you have ECR set up)
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ECR_REGION="$${REGION}"
    ECR_REGISTRY="$${AWS_ACCOUNT_ID}.dkr.ecr.$${ECR_REGION}.amazonaws.com"

    aws ecr get-login-password --region "$${ECR_REGION}" | docker login --username AWS --password-stdin "$${ECR_REGISTRY}"

    ECR_REPOSITORY_NAME="${var.ecr_repository_name}"
    ECR_IMAGE_TAG="latest"

    echo "Pulling Docker image from ECR..."
    docker pull "$${ECR_REGISTRY}/$${ECR_REPOSITORY_NAME}:$${ECR_IMAGE_TAG}"

    # Run the Docker container with environment variables
    echo "Running the Docker container..."
    docker run -d -p 80:80 \
      -e AWS_REGION="$${AWS_REGION}" \
      -e COGNITO_USER_POOL_ID="$${COGNITO_USER_POOL_ID}" \
      -e COGNITO_APP_CLIENT_ID="$${COGNITO_APP_CLIENT_ID}" \
      -e COGNITO_DOMAIN="$${COGNITO_DOMAIN}" \
      -e S3_BUCKET_NAME="$${S3_BUCKET_NAME}" \
      -e DB_SECRET_NAME="$${DB_SECRET_NAME}" \
      "$${ECR_REGISTRY}/$${ECR_REPOSITORY_NAME}:$${ECR_IMAGE_TAG}"

    echo "Provisioning complete."
  EOF

  tags = {
    Name          = "Code Analysis App Server"
    qut-username  = "n10752846@qut.edu.au"
    purpose       = "assessment2"
  }
}

# Cognito User Pool
resource "aws_cognito_user_pool" "user_pool" {
  name = "${var.username}-code-analysis-user-pool"

  # auto_verified_attributes = ["email"]
  # estimated_number_of_users = 10

  schema {
    attribute_data_type = "String"
    name                = "email"
    required            = true
    mutable             = false
  }

  tags = {
    Name = "Cognito User Pool"
    qut-username = "n10752846@qut.edu.au"
    purpose = "assessment2"
  }
}

# Cognito User Pool Domain
resource "aws_cognito_user_pool_domain" "user_pool_domain" {
  domain   = "${var.username}-code-analysis"
  user_pool_id = aws_cognito_user_pool.user_pool.id
}

# Google Identity Provider for Cognito
resource "aws_cognito_identity_provider" "google_provider" {
  provider_name = "Google"
  provider_type = "Google"
  user_pool_id  = aws_cognito_user_pool.user_pool.id

  provider_details = {
    authorize_scopes = "email"
    client_id     = var.google_client_id
    client_secret = var.google_client_secret
  }

  attribute_mapping = {
    email = "email"
  }
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "user_pool_client" {
  name                         = "code-analysis-client-${var.username}"
  user_pool_id                 = aws_cognito_user_pool.user_pool.id
  generate_secret              = false
  explicit_auth_flows          = ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_PASSWORD_AUTH"]
  prevent_user_existence_errors = "ENABLED"
  supported_identity_providers = ["Google"]
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows = ["code"]
  allowed_oauth_scopes = ["email", "openid", "profile"]
  callback_urls = ["http://localhost:3000"]
}

# Route53 Record pointing to EC2 instance
resource "aws_route53_record" "app_dns" {
  zone_id = var.route53_zone_id
  name    = "${var.subdomain}.${var.domain}"
  type    = "CNAME"
  ttl     = 300
  records = [aws_instance.app_instance.public_ip]
}

# Secrets Manager for Database Credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name = "${var.username}_db_secret"
  recovery_window_in_days = 0

  tags = {
    Name = "DB Credentials Secret"
    qut-username = "n10752846@qut.edu.au"
    purpose = "assessment2"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials_version" {

  secret_id     = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    host     = aws_db_instance.metadata_db.address
    port     = aws_db_instance.metadata_db.port
    dbname   = aws_db_instance.metadata_db.db_name
  })
}

# Parameter Store for Application Configurations
resource "aws_ssm_parameter" "app_config" {
  name  = "/code-analysis/app-config"
  type  = "String"
  value = jsonencode({
    AWS_REGION            = var.aws_region
    COGNITO_USER_POOL_ID  = aws_cognito_user_pool.user_pool.id
    COGNITO_APP_CLIENT_ID = aws_cognito_user_pool_client.user_pool_client.id
    COGNITO_DOMAIN        = aws_cognito_user_pool_domain.user_pool_domain.domain
    S3_BUCKET_NAME        = aws_s3_bucket.analysis_results.bucket
    DB_SECRET_NAME        = aws_secretsmanager_secret.db_credentials.name
  })

  tags = {
    purpose      = "assessment-2"
    qut-username = "n10752846@qut.edu.au"
  }
}

# Outputs (optional)
output "ec2_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.app_instance.public_ip
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.analysis_results.bucket
}

output "rds_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = aws_db_instance.metadata_db.endpoint
}

output "rds_secret_name" {
  description = "Name of the RDS secret"
  value       = aws_secretsmanager_secret.db_credentials.name
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.user_pool.id
}

output "cognito_app_client_id" {
  description = "Cognito App Client ID"
  value       = aws_cognito_user_pool_client.user_pool_client.id
}

output "app_dns_name" {
  description = "DNS name of your application"
  value       = "${var.subdomain}.${var.domain}"
}

output "cognito_domain" {
  description = "Cognito User Pool Domain"
  value       = "${aws_cognito_user_pool_domain.user_pool_domain.domain}.auth.${var.aws_region}.amazoncognito.com"
}