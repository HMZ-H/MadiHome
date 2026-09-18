#!/bin/bash

# MadiHome Production Deployment Script
# This script deploys the application to production

set -e

echo "🚀 Starting MadiHome Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}Warning: .env.production not found. Creating from example...${NC}"
    cp env.production.example .env.production
    echo -e "${RED}Please edit .env.production with your production values before continuing.${NC}"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

echo -e "${GREEN}✅ Environment variables loaded${NC}"

# Build and start services
echo -e "${YELLOW}🔨 Building Docker images...${NC}"
docker-compose -f docker-compose.prod.yml build

echo -e "${YELLOW}🚀 Starting production services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 30

# Check if services are running
echo -e "${YELLOW}🔍 Checking service health...${NC}"

# Check database
if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U $DB_USER -d $DB_NAME; then
    echo -e "${GREEN}✅ Database is ready${NC}"
else
    echo -e "${RED}❌ Database is not ready${NC}"
    exit 1
fi

# Check backend
if curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is ready${NC}"
else
    echo -e "${RED}❌ Backend is not ready${NC}"
    exit 1
fi

# Check frontend
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is ready${NC}"
else
    echo -e "${RED}❌ Frontend is not ready${NC}"
    exit 1
fi

# Run database migrations
echo -e "${YELLOW}🗄️ Running database migrations...${NC}"
docker-compose -f docker-compose.prod.yml exec -T backend ./migrate up

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your application is now running at:${NC}"
echo -e "   Frontend: http://localhost:80"
echo -e "   Backend API: http://localhost:8080"
echo -e "   Monitoring: http://localhost:3000 (Grafana)"
echo -e "   Metrics: http://localhost:9090 (Prometheus)"

echo -e "${YELLOW}📋 Next steps:${NC}"
echo -e "   1. Set up SSL certificates in nginx/ssl/"
echo -e "   2. Configure your domain in nginx/nginx.conf"
echo -e "   3. Set up monitoring alerts"
echo -e "   4. Configure backup strategy"

echo -e "${GREEN}✅ Production deployment complete!${NC}"

