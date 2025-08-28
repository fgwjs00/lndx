#!/bin/bash

# ====================================
# LNDX系统 - 腾讯云宝塔面板一键部署脚本
# ====================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[信息]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[成功]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[警告]${NC} $1"
}

log_error() {
    echo -e "${RED}[错误]${NC} $1"
}

# 显示帮助信息
show_help() {
    cat << EOF
LNDX系统 - 腾讯云宝塔面板一键部署脚本

用法: ./baota-deploy.sh [选项]

必需参数:
    --domain DOMAIN        你的域名 (如: example.com)
    --db-pass PASSWORD     数据库密码

可选参数:
    --db-name NAME         数据库名 (默认: lndx_production)
    --db-user USER         数据库用户名 (默认: postgres)
    --db-type TYPE         数据库类型: postgresql|mysql (默认: postgresql)
    --update               更新模式 (不重新创建数据库)
    --help, -h             显示帮助信息

示例:
    ./baota-deploy.sh --domain example.com --db-pass mypassword123
    ./baota-deploy.sh --domain example.com --db-pass mypass --db-type mysql
    ./baota-deploy.sh --update --domain example.com

EOF
}

# 检查宝塔环境
check_baota_env() {
    log_info "检查宝塔环境..."
    
    if [[ ! -d "/www/server/panel" ]]; then
        log_error "未检测到宝塔面板，请确保在宝塔服务器上运行！"
        exit 1
    fi
    
    # 检查必需目录
    if [[ ! -d "/www/wwwroot" ]]; then
        log_error "宝塔网站目录不存在"
        exit 1
    fi
    
    log_success "✅ 宝塔环境检查通过"
}

# 检查必需软件
check_required_software() {
    log_info "检查必需软件..."
    
    local missing=()
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        missing+=("Node.js 18.x")
    else
        local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $node_version -lt 16 ]]; then
            missing+=("Node.js 18.x (当前版本过低)")
        fi
    fi
    
    # 检查pnpm
    if ! command -v pnpm &> /dev/null; then
        missing+=("pnpm")
    fi
    
    # 检查PM2
    if ! command -v pm2 &> /dev/null; then
        missing+=("PM2")
    fi
    
    # 检查数据库
    if [[ "$DB_TYPE" == "postgresql" ]]; then
        if ! command -v psql &> /dev/null; then
            missing+=("PostgreSQL")
        fi
    elif [[ "$DB_TYPE" == "mysql" ]]; then
        if ! command -v mysql &> /dev/null; then
            missing+=("MySQL")
        fi
    fi
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "缺少以下软件，请通过宝塔面板安装:"
        for software in "${missing[@]}"; do
            log_error "  ❌ $software"
        done
        log_info "安装方法: 宝塔面板 → 软件商店 → 搜索安装"
        exit 1
    fi
    
    log_success "✅ 所有必需软件已安装"
}

# 配置环境变量
setup_env() {
    log_info "配置环境变量..."
    
    cd backend
    
    # 生成JWT密钥
    local jwt_secret=$(openssl rand -base64 64 | tr -d '\n')
    
    # 数据库URL (使用超级用户避免权限问题)
    local database_url
    if [[ "$DB_TYPE" == "postgresql" ]]; then
        database_url="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME?schema=public"
    else
        # MySQL使用root用户
        if [[ "$DB_USER" == "postgres" ]]; then
            DB_USER="root"
        fi
        database_url="mysql://$DB_USER:$DB_PASS@localhost:3306/$DB_NAME"
    fi
    
    # 创建.env文件
    cat > .env << EOF
# LNDX系统生产环境配置
NODE_ENV=production
PORT=3000
APP_NAME=LNDX学生报名管理系统

# 数据库配置
DATABASE_URL="$database_url"

# JWT配置
JWT_SECRET=$jwt_secret
JWT_EXPIRES_IN=7d

# 跨域配置
CORS_ORIGIN=https://$DOMAIN

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx,xls,xlsx

# 日志配置
LOG_LEVEL=info
EOF
    
    cd ..
    log_success "✅ 环境变量配置完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    # 安装全局依赖
    if ! command -v pnpm &> /dev/null; then
        npm install -g pnpm
    fi
    
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
    fi
    
    # 后端依赖
    log_info "安装后端依赖..."
    cd backend
    pnpm install
    cd ..
    
    # 前端依赖
    log_info "安装前端依赖..."
    cd frontend
    pnpm install
    cd ..
    
    log_success "✅ 依赖安装完成"
}

# 编译项目
build_project() {
    log_info "编译项目..."
    
    # 编译后端 (TypeScript → JavaScript)
    log_info "编译后端..."
    cd backend
    
    # 生成Prisma客户端 (编译前必需)
    log_info "生成Prisma客户端..."
    pnpm prisma generate
    
    # 编译TypeScript
    pnpm build
    if [[ ! -f "dist/index.js" ]]; then
        log_error "后端编译失败！"
        exit 1
    fi
    cd ..
    
    # 编译前端 (Vue3 → 静态文件)
    log_info "编译前端..."
    cd frontend
    pnpm build
    if [[ ! -f "dist/index.html" ]]; then
        log_error "前端编译失败！"
        exit 1
    fi
    cd ..
    
    log_success "✅ 项目编译完成"
}

# 初始化数据库
init_database() {
    log_info "初始化数据库..."
    
    cd backend
    
    # 生成Prisma客户端
    pnpm prisma generate
    
    # 数据库迁移
    if [[ "$UPDATE_MODE" == "true" ]]; then
        pnpm prisma db push
    else
        pnpm prisma db push --accept-data-loss
        
        # 询问是否填充示例数据
        echo ""
        read -p "是否填充示例数据？(包含默认管理员账户) (y/N): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            pnpm prisma db seed
            log_success "✅ 示例数据填充完成"
        fi
    fi
    
    cd ..
    log_success "✅ 数据库初始化完成"
}

# 配置Nginx
setup_nginx() {
    log_info "配置Nginx..."
    
    local nginx_config="/www/server/panel/vhost/nginx/${DOMAIN}.conf"
    
    # 创建Nginx配置
    cat > "$nginx_config" << EOF
server {
    listen 80;
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};
    
    # 根目录指向前端构建文件
    root /www/wwwroot/lndx/frontend/dist;
    index index.html;
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    
    # 安全头
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    
    # API代理到后端Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 上传文件访问
    location /uploads/ {
        alias /www/wwwroot/lndx/uploads/;
        expires 30d;
        add_header Cache-Control "public";
        
        # 安全限制
        location ~ \.(php|jsp|asp|aspx|cgi)\$ {
            deny all;
        }
    }
    
    # 健康检查
    location /health {
        proxy_pass http://127.0.0.1:3001/health;
        access_log off;
    }
    
    # 前端路由支持 (SPA)
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # 静态文件缓存
        location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }
        
        # HTML文件不缓存
        location ~* \.(html|htm)\$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
        }
    }
    
    # 阻止访问敏感文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ \.(env|log|config)\$ {
        deny all;
    }
    
    # 引入宝塔生成的配置
    include /www/server/panel/vhost/rewrite/${DOMAIN}.conf;
}
EOF
    
    # 测试Nginx配置
    if nginx -t &> /dev/null; then
        systemctl reload nginx
        log_success "✅ Nginx配置完成"
    else
        log_warning "⚠️ Nginx配置可能有问题，请检查"
    fi
}

# 启动PM2服务
start_pm2() {
    log_info "启动PM2服务..."
    
    # 创建日志目录
    mkdir -p logs
    
    # 停止已存在的进程
    pm2 delete lndx-backend 2>/dev/null || true
    
    # 创建PM2配置文件
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'lndx-backend',
    script: './backend/dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: './logs/pm2.log',
    out_file: './logs/pm2-out.log',
    error_file: './logs/pm2-error.log',
    max_memory_restart: '512M',
    node_args: '--max-old-space-size=512',
    max_restarts: 10,
    min_uptime: '10s',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads']
  }]
}
EOF
    
    # 启动应用
    pm2 start ecosystem.config.js
    
    # 保存PM2配置
    pm2 save
    
    # 设置开机启动
    pm2 startup || true
    
    log_success "✅ PM2服务启动完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    local max_attempts=15
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if curl -sf "http://localhost:3000/health" > /dev/null 2>&1; then
            log_success "✅ 后端服务健康检查通过"
            break
        fi
        
        attempt=$((attempt + 1))
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "❌ 后端服务健康检查失败"
            log_info "查看日志: pm2 logs lndx-backend"
            return 1
        fi
        
        log_info "等待服务启动... ($attempt/$max_attempts)"
        sleep 3
    done
    
    # 测试网站访问
    if curl -sf "http://localhost/health" > /dev/null 2>&1 || curl -sf "https://$DOMAIN/health" > /dev/null 2>&1; then
        log_success "✅ 网站健康检查通过"
    else
        log_warning "⚠️ 网站访问可能需要配置SSL证书"
    fi
}

# 显示部署完成信息
show_completion() {
    log_success "==============================================="
    log_success "🎉 LNDX系统部署成功！"
    log_success "==============================================="
    
    echo ""
    log_info "📱 访问信息:"
    log_info "  🌐 网站首页: http://$DOMAIN (建议配置HTTPS)"
    log_info "  🔌 后端API: http://$DOMAIN/api"
    log_info "  ❤️ 健康检查: http://$DOMAIN/health"
    
    echo ""
    log_info "🔐 默认账户 (首次登录需修改密码):"
    log_info "  👑 超级管理员: 13800000000 / password123"
    log_info "  👨‍🏫 教师账户: 13800000001 / password123"  
    log_info "  👨‍🎓 学生账户: 13800000002 / password123"
    
    echo ""
    log_info "🛠️ 宝塔面板管理:"
    log_info "  📊 网站管理: 网站 → $DOMAIN → 设置"
    log_info "  🗄️ 数据库: 数据库 → $DB_NAME (用户: $DB_USER)"
    log_info "  🔧 PM2管理: 软件商店 → PM2管理器"
    log_info "  🔒 SSL证书: 网站 → $DOMAIN → SSL"
    
    echo ""
    log_info "🔄 常用命令:"
    log_info "  查看状态: pm2 status"
    log_info "  查看日志: pm2 logs lndx-backend"
    log_info "  重启服务: pm2 restart lndx-backend"
    
    echo ""
    log_warning "⚠️ 重要提醒:"
    log_warning "  1. 立即修改所有默认密码！"
    log_warning "  2. 配置SSL证书: 宝塔面板 → 网站 → SSL"
    log_warning "  3. 设置定期备份: 宝塔面板 → 计划任务"
    log_warning "  4. 配置防火墙: 只开放80、443、22端口"
}

# 主函数
main() {
    log_info "开始部署LNDX学生报名管理系统..."
    log_info "============================================="
    
    check_baota_env
    check_required_software
    setup_env
    install_dependencies
    build_project
    init_database
    setup_nginx
    start_pm2
    health_check
    show_completion
}

# 解析命令行参数
DOMAIN=""
DB_PASS=""
DB_NAME="lndx_production"
DB_USER="postgres"
DB_TYPE="postgresql"
UPDATE_MODE="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_help
            exit 0
            ;;
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --db-pass)
            DB_PASS="$2"
            shift 2
            ;;
        --db-name)
            DB_NAME="$2"
            shift 2
            ;;
        --db-user)
            DB_USER="$2"
            shift 2
            ;;
        --db-type)
            DB_TYPE="$2"
            shift 2
            ;;
        --update)
            UPDATE_MODE="true"
            shift
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 参数验证
if [[ -z "$DOMAIN" ]]; then
    log_error "请指定域名: --domain your-domain.com"
    exit 1
fi

if [[ -z "$DB_PASS" ]] && [[ "$UPDATE_MODE" != "true" ]]; then
    log_error "请指定数据库密码: --db-pass your-password"
    log_warning "⚠️ 注意: 请使用 postgres 超级用户密码以避免权限问题"
    exit 1
fi

# 执行部署
main
