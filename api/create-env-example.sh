#!/bin/bash
# Script to create .env.example from template

cat > .env.example << 'EOF'
# Database Configuration
# Option 1: Direct PostgreSQL connection string
# Format: postgresql://username:password@host:port/database
# IMPORTANT: If your password contains special characters (@, #, %, :, /, etc.),
# you must URL-encode them. For example:
#   @ becomes %40
#   # becomes %23
#   % becomes %25
#   : becomes %3A
#   / becomes %2F
# Example: If password is "myp@ss#word", use "myp%40ss%23word"
# You can encode it with: node -e "console.log(encodeURIComponent('your-password'))"
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/starterx

# Option 2: Supabase Configuration (alternative to DATABASE_URL)
# If using Supabase, you can use these instead of DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_DB_PASSWORD=your-database-password
# Or use: DATABASE_PASSWORD=your-database-password

# JWT Authentication
# Generate a secure random string for production
# You can use: openssl rand -base64 32
JWT_SECRET=your-secret-key-here-change-in-production

# Server Configuration
# Port for the API server (default: 4000)
PORT=4000

# Frontend URL (for OAuth redirects and CORS)
# Defaults to http://localhost:3000 if not set
FRONTEND_URL=http://localhost:3000

# Logging
# Set to 'true' to reduce log output (useful for production)
QUIET_LOGS=false

# Node Environment
# Set to 'production' for production deployments
NODE_ENV=development

# Database Connection Pool (Optional)
# Maximum number of clients in the pool (default: 20)
# PG_MAX_CLIENTS=20

# Session Mode (Optional - for connection poolers like PgBouncer)
# Set to 'true' if using a connection pooler in session mode
# PG_SESSION_MODE=false
# PG_SESSION_MAX_CLIENTS=1

# Admin User Setup (Optional - for initial admin creation)
# These are used by the setup-admin endpoint if no admin exists
# ADMIN_EMAIL=admin@example.com
# ADMIN_USERNAME=admin
# ADMIN_PASSWORD=admin123
# ADMIN_FIRST=Admin
# ADMIN_LAST=User
# ADMIN_ROLE=admin

# OpenAI Integration (Optional)
# OPENAI_API_KEY=your-openai-api-key

# AWS S3 Configuration (Optional - for file uploads)
# S3_BUCKET=your-bucket-name
# S3_REGION=us-east-1
# S3_ENDPOINT=https://s3.amazonaws.com

# QuickBooks Integration (Optional)
# QUICKBOOKS_CLIENT_ID=your-client-id
# QUICKBOOKS_CLIENT_SECRET=your-client-secret
# QUICKBOOKS_ENVIRONMENT=sandbox
EOF

echo ".env.example created successfully!"

