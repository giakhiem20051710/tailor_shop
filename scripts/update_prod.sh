#!/bin/bash

# Configuration
PROJECT_DIR="/home/ubuntu/tailor_shop" # Cập nhật đường dẫn này cho đúng với VPS của bạn

echo "========================================="
echo "   UPDATING PRODUCTION ENVIRONMENT       "
echo "========================================="

# Go to project directory
cd $PROJECT_DIR || { echo "Không tìm thấy thư mục dự án!"; exit 1; }

# Pull latest changes
echo "Step 1: Pulling latest changes from GitHub..."
git pull origin main

# Rebuild and restart containers
echo "Step 2: Rebuilding and restarting containers..."
# --build: Buộc xây dựng lại image nếu có thay đổi code
# -d: Chạy ngầm 
docker compose up -d --build

echo "Step 3: Cleaning up old images..."
docker image prune -f

echo "========================================="
echo "   UPDATE COMPLETE!                      "
echo "========================================="
echo "Kiểm tra trạng thái container:"
docker ps
