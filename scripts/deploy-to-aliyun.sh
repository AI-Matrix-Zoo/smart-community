#!/bin/bash

# 智慧小区生活平台 - 阿里云服务器一键部署脚本
# 版本: 1.0.0

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_NAME="智慧小区生活平台"
VERSION="1.0.0"
PROJECT_DIR="/opt/smart-community"
BACKEND_PORT=3000
FRONTEND_PORT=80

# 显示标题
show_header() {
    echo -e "${BLUE}"
    cat << "EOF"
  ____  _     _                      
 / ___|| |   (_)                     
| |    | |    _  _ __   _   _ __  __  
| |    | |   | || '_ \ | | | |\ \/ /  
| |____| |___| || | | || |_| | >  <   
 \_____|_____|_||_| |_| \__,_|/_/\_\  

EOF
    echo -e "${NC}"
    echo -e "${GREEN}${PROJECT_NAME} 阿里云服务器部署脚本 v${VERSION}${NC}"
    echo ""
}

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "${YELLOW}================================${NC}"
    echo -e "${YELLOW}  $1${NC}"
    echo -e "${YELLOW}================================${NC}"
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "检测到root用户，建议使用普通用户运行此脚本"
        read -p "是否继续？(y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# 检测操作系统
detect_os() {
    log_header "检测操作系统"
    
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        log_error "无法检测操作系统"
        exit 1
    fi
    
    log_success "操作系统: $OS $VER"
    
    # 设置包管理器
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        PKG_MANAGER="apt"
        PKG_UPDATE="sudo apt update"
        PKG_INSTALL="sudo apt install -y"
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
        PKG_MANAGER="yum"
        PKG_UPDATE="sudo yum update -y"
        PKG_INSTALL="sudo yum install -y"
    else
        log_error "不支持的操作系统: $OS"
        exit 1
    fi
}

# 检查网络连接
check_network() {
    log_header "检查网络连接"
    
    if ping -c 1 google.com &> /dev/null; then
        log_success "网络连接正常"
    else
        log_error "网络连接失败，请检查网络设置"
        exit 1
    fi
}

# 更新系统包
update_system() {
    log_header "更新系统包"
    
    log_info "更新包列表..."
    $PKG_UPDATE
    
    if [[ "$PKG_MANAGER" == "apt" ]]; then
        log_info "升级系统包..."
        sudo apt upgrade -y
    fi
    
    log_success "系统包更新完成"
}

# 安装基础依赖
install_dependencies() {
    log_header "安装基础依赖"
    
    # 安装基础工具
    log_info "安装基础工具..."
    if [[ "$PKG_MANAGER" == "apt" ]]; then
        $PKG_INSTALL curl wget git unzip build-essential
    else
        $PKG_INSTALL curl wget git unzip gcc gcc-c++ make
    fi
    
    # 安装Node.js
    install_nodejs
    
    # 安装PM2
    install_pm2
    
    # 安装Nginx
    install_nginx
    
    log_success "基础依赖安装完成"
}

# 安装Node.js
install_nodejs() {
    log_info "检查Node.js安装状态..."
    
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        log_success "Node.js已安装: $NODE_VERSION"
        
        # 检查版本是否满足要求
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -lt 16 ]; then
            log_warning "Node.js版本过低，需要升级到18+"
            install_nodejs_fresh
        fi
    else
        log_info "安装Node.js 18..."
        install_nodejs_fresh
    fi
}

# 全新安装Node.js
install_nodejs_fresh() {
    if [[ "$PKG_MANAGER" == "apt" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    fi
    
    # 验证安装
    if command -v node &> /dev/null && command -v npm &> /dev/null; then
        log_success "Node.js安装成功: $(node --version)"
        log_success "npm版本: $(npm --version)"
    else
        log_error "Node.js安装失败"
        exit 1
    fi
}

# 安装PM2
install_pm2() {
    log_info "检查PM2安装状态..."
    
    if command -v pm2 &> /dev/null; then
        log_success "PM2已安装: $(pm2 --version)"
    else
        log_info "安装PM2..."
        sudo npm install -g pm2
        
        if command -v pm2 &> /dev/null; then
            log_success "PM2安装成功: $(pm2 --version)"
        else
            log_error "PM2安装失败"
            exit 1
        fi
    fi
}

# 安装Nginx
install_nginx() {
    log_info "检查Nginx安装状态..."
    
    if command -v nginx &> /dev/null; then
        log_success "Nginx已安装: $(nginx -v 2>&1 | cut -d' ' -f3)"
    else
        log_info "安装Nginx..."
        $PKG_INSTALL nginx
        
        # 启动并设置开机自启
        sudo systemctl start nginx
        sudo systemctl enable nginx
        
        if command -v nginx &> /dev/null; then
            log_success "Nginx安装成功"
        else
            log_error "Nginx安装失败"
            exit 1
        fi
    fi
}

# 配置防火墙
configure_firewall() {
    log_header "配置防火墙"
    
    if command -v ufw &> /dev/null; then
        log_info "配置UFW防火墙..."
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw allow $BACKEND_PORT/tcp
        
        # 检查UFW状态
        if sudo ufw status | grep -q "Status: active"; then
            log_success "UFW防火墙配置完成"
        else
            log_warning "UFW未启用，请手动启用: sudo ufw enable"
        fi
    elif command -v firewall-cmd &> /dev/null; then
        log_info "配置firewalld防火墙..."
        sudo firewall-cmd --permanent --add-port=22/tcp
        sudo firewall-cmd --permanent --add-port=80/tcp
        sudo firewall-cmd --permanent --add-port=443/tcp
        sudo firewall-cmd --permanent --add-port=$BACKEND_PORT/tcp
        sudo firewall-cmd --reload
        log_success "firewalld防火墙配置完成"
    else
        log_warning "未检测到防火墙，请手动配置端口开放"
    fi
}

# 克隆或更新项目
setup_project() {
    log_header "设置项目代码"
    
    if [ -d "$PROJECT_DIR" ]; then
        log_info "项目目录已存在，更新代码..."
        cd $PROJECT_DIR
        git pull origin main
    else
        log_info "克隆项目代码..."
        sudo mkdir -p /opt
        
        # 如果当前目录是项目目录，直接复制
        if [ -f "package.json" ] || [ -d "backend" ] && [ -d "frontend" ]; then
            log_info "从当前目录复制项目..."
            sudo cp -r . $PROJECT_DIR
        else
            log_error "请在项目根目录运行此脚本，或提供Git仓库地址"
            read -p "请输入Git仓库地址 (留空跳过): " REPO_URL
            if [ -n "$REPO_URL" ]; then
                sudo git clone $REPO_URL $PROJECT_DIR
            else
                exit 1
            fi
        fi
    fi
    
    # 设置目录权限
    sudo chown -R $USER:$USER $PROJECT_DIR
    log_success "项目代码设置完成"
}

# 配置环境变量
configure_environment() {
    log_header "配置环境变量"
    
    cd $PROJECT_DIR
    
    # 获取服务器IP
    SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "localhost")
    log_info "检测到服务器IP: $SERVER_IP"
    
    # 配置后端环境
    log_info "配置后端环境变量..."
    cd backend
    
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# 生产环境配置
NODE_ENV=production
PORT=$BACKEND_PORT

# JWT配置
JWT_SECRET=smart-community-super-secret-jwt-key-2024-production
JWT_EXPIRES_IN=7d

# 数据库配置
DATABASE_PATH=./data/smart-community.db

# CORS配置
FRONTEND_URL=http://$SERVER_IP

# 邮箱服务配置
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=1217112842@qq.com
EMAIL_PASS=tfxjopirvegaidih
EMAIL_FROM=1217112842@qq.com
EMAIL_ENABLED=true

# 短信服务配置
SMS_ENABLED=true
SMS_PROVIDER=aliyun
ALIBABA_CLOUD_ACCESS_KEY_ID=your-alibaba-access-key-id
ALIBABA_CLOUD_ACCESS_KEY_SECRET=your-alibaba-access-key-secret
SMS_SIGN_NAME=智慧小区
SMS_TEMPLATE_CODE=SMS_319401912

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# 日志级别
LOG_LEVEL=info
EOF
        log_success "后端环境配置已创建"
    else
        log_success "后端环境配置已存在"
    fi
    
    # 配置前端环境
    log_info "配置前端环境变量..."
    cd ../frontend
    
    cat > .env.production << EOF
# 生产环境配置
VITE_APP_ENV=production
VITE_API_BASE_URL=http://$SERVER_IP:$BACKEND_PORT/api
VITE_APP_NAME=智慧小区生活平台
EOF
    log_success "前端环境配置已创建"
}

# 安装项目依赖
install_project_dependencies() {
    log_header "安装项目依赖"
    
    cd $PROJECT_DIR
    
    # 安装后端依赖
    log_info "安装后端依赖..."
    cd backend
    npm install
    log_success "后端依赖安装完成"
    
    # 安装前端依赖
    log_info "安装前端依赖..."
    cd ../frontend
    npm install
    log_success "前端依赖安装完成"
}

# 构建项目
build_project() {
    log_header "构建项目"
    
    cd $PROJECT_DIR
    
    # 构建后端
    log_info "构建后端..."
    cd backend
    npm run build
    log_success "后端构建完成"
    
    # 构建前端
    log_info "构建前端..."
    cd ../frontend
    npm run build
    log_success "前端构建完成"
}

# 配置Nginx
configure_nginx() {
    log_header "配置Nginx"
    
    SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "localhost")
    
    # 创建Nginx配置文件
    sudo tee /etc/nginx/sites-available/smart-community > /dev/null << EOF
server {
    listen 80;
    server_name $SERVER_IP _;

    # 前端静态文件
    location / {
        root $PROJECT_DIR/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # 后端API代理
    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # 健康检查
    location /health {
        proxy_pass http://localhost:$BACKEND_PORT/health;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        root $PROJECT_DIR/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

    # 启用站点配置
    if [ -d "/etc/nginx/sites-enabled" ]; then
        sudo ln -sf /etc/nginx/sites-available/smart-community /etc/nginx/sites-enabled/
        sudo rm -f /etc/nginx/sites-enabled/default
    else
        # CentOS/RHEL 配置
        sudo cp /etc/nginx/sites-available/smart-community /etc/nginx/conf.d/smart-community.conf
    fi
    
    # 测试Nginx配置
    if sudo nginx -t; then
        log_success "Nginx配置测试通过"
        sudo systemctl reload nginx
        log_success "Nginx配置已重新加载"
    else
        log_error "Nginx配置测试失败"
        exit 1
    fi
}

# 启动服务
start_services() {
    log_header "启动服务"
    
    cd $PROJECT_DIR/backend
    
    # 停止现有的PM2进程
    pm2 delete smart-community-backend 2>/dev/null || true
    
    # 启动后端服务
    log_info "启动后端服务..."
    pm2 start dist/index.js --name "smart-community-backend"
    
    # 保存PM2配置
    pm2 save
    
    # 设置PM2开机自启
    pm2 startup | grep -E '^sudo' | bash || true
    
    log_success "后端服务启动完成"
    
    # 重启Nginx
    log_info "重启Nginx..."
    sudo systemctl restart nginx
    log_success "Nginx重启完成"
}

# 测试部署
test_deployment() {
    log_header "测试部署"
    
    SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "localhost")
    
    # 等待服务启动
    sleep 5
    
    # 测试后端健康检查
    log_info "测试后端健康检查..."
    if curl -f http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
        log_success "后端服务运行正常"
    else
        log_error "后端服务测试失败"
    fi
    
    # 测试Nginx代理
    log_info "测试Nginx代理..."
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log_success "Nginx代理配置正常"
    else
        log_error "Nginx代理测试失败"
    fi
    
    # 显示访问信息
    echo ""
    log_success "部署完成！"
    echo -e "${GREEN}前端访问地址: http://$SERVER_IP${NC}"
    echo -e "${GREEN}后端API地址: http://$SERVER_IP:$BACKEND_PORT${NC}"
    echo -e "${GREEN}健康检查: http://$SERVER_IP/health${NC}"
}

# 显示管理命令
show_management_commands() {
    log_header "常用管理命令"
    
    echo "🔧 服务管理:"
    echo "   pm2 list                    # 查看所有进程"
    echo "   pm2 restart smart-community-backend  # 重启后端"
    echo "   pm2 logs smart-community-backend     # 查看日志"
    echo "   pm2 monit                   # 监控面板"
    echo ""
    echo "🌐 Nginx管理:"
    echo "   sudo systemctl restart nginx    # 重启Nginx"
    echo "   sudo systemctl reload nginx     # 重新加载配置"
    echo "   sudo nginx -t                   # 测试配置"
    echo ""
    echo "📊 系统监控:"
    echo "   htop                        # 系统资源监控"
    echo "   df -h                       # 磁盘使用情况"
    echo "   free -h                     # 内存使用情况"
    echo ""
    echo "🔄 更新部署:"
    echo "   cd $PROJECT_DIR && git pull && ./scripts/deploy-to-aliyun.sh"
}

# 主函数
main() {
    show_header
    
    # 检查权限
    check_root
    
    # 系统检查
    detect_os
    check_network
    
    # 安装依赖
    update_system
    install_dependencies
    
    # 配置防火墙
    configure_firewall
    
    # 设置项目
    setup_project
    configure_environment
    install_project_dependencies
    build_project
    
    # 配置服务
    configure_nginx
    start_services
    
    # 测试部署
    test_deployment
    
    # 显示管理命令
    show_management_commands
    
    echo ""
    log_success "🎉 智慧小区生活平台部署完成！"
    echo -e "${YELLOW}📖 详细文档请参考: docs/阿里云服务器部署指南.md${NC}"
}

# 运行主函数
main "$@" 