#!/bin/bash

# 设置环境变量
export NODE_ENV=production
export PORT=3000
export JWT_SECRET=smart-community-super-secret-jwt-key-2024-production
export EMAIL_HOST=smtp.qq.com
export EMAIL_PORT=587
export EMAIL_SECURE=false
export EMAIL_USER=1217112842@qq.com
export EMAIL_PASS=tfxjopirvegaidih
export EMAIL_FROM=1217112842@qq.com
export EMAIL_ENABLED=true

# 启动应用
node dist/index.js 