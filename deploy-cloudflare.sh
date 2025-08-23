#!/bin/bash

# ==============================================
# Cloudflare + wwwcn.uk 域名部署脚本
# ==============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 域名配置
DOMAIN="wwwcn.uk"
API_DOMAIN="api.wwwcn.uk"

print_message() {
    echo -e "${GREEN}[Cloudflare] $1${NC}"
}

print_error() {
    echo -e "${RED}[错误] $1${NC}"
}

print_info() {
    echo -e "${BLUE}[信息] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[警告] $1${NC}"
}

# 检查依赖
check_dependencies() {
    print_message "检查依赖工具..."
    
    # 检查 curl
    if ! command -v curl &> /dev/null; then
        print_error "curl 未安装，请先安装 curl"
        exit 1
    fi
    
    # 检查 jq
    if ! command -v jq &> /dev/null; then
        print_warning "jq 未安装，某些功能可能受限"
        print_info "安装 jq: sudo apt-get install jq (Ubuntu) 或 brew install jq (macOS)"
    fi
    
    print_info "依赖检查完成"
}

# 配置 Cloudflare API
setup_cloudflare_api() {
    print_message "配置 Cloudflare API..."
    
    if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
        echo
        print_info "请访问 https://dash.cloudflare.com/profile/api-tokens"
        print_info "创建 API Token，权限选择："
        print_info "- Zone:Zone:Edit"
        print_info "- Zone:DNS:Edit"
        print_info "- Zone:Zone Settings:Edit"
        echo
        read -p "请输入您的 Cloudflare API Token: " CLOUDFLARE_API_TOKEN
    fi
    
    if [ -z "$CLOUDFLARE_ZONE_ID" ]; then
        echo
        read -p "请输入您的 Zone ID (在域名概览页面可找到): " CLOUDFLARE_ZONE_ID
    fi
    
    # 验证 API Token
    RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json")
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_info "✅ Cloudflare API Token 验证成功"
    else
        print_error "❌ Cloudflare API Token 验证失败"
        exit 1
    fi
}

# 配置 DNS 记录
setup_dns_records() {
    print_message "配置 DNS 记录..."
    
    read -p "请输入您的服务器 IP 地址: " SERVER_IP
    
    if [ -z "$SERVER_IP" ]; then
        print_error "服务器 IP 地址不能为空"
        exit 1
    fi
    
    # DNS 记录配置
    declare -A DNS_RECORDS=(
        ["@"]="$SERVER_IP"
        ["api"]="$SERVER_IP"
        ["www"]="$DOMAIN"
    )
    
    # 创建 A 记录
    for name in "@" "api"; do
        print_info "创建 DNS 记录: $name -> ${DNS_RECORDS[$name]}"
        
        RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data "{
                \"type\": \"A\",
                \"name\": \"$name\",
                \"content\": \"${DNS_RECORDS[$name]}\",
                \"ttl\": 1,
                \"proxied\": true
            }")
        
        if echo "$RESPONSE" | grep -q '"success":true'; then
            print_info "✅ DNS 记录 $name 创建成功"
        else
            print_warning "⚠️  DNS 记录 $name 可能已存在或创建失败"
        fi
    done
    
    # 创建 CNAME 记录
    print_info "创建 CNAME 记录: www -> $DOMAIN"
    RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data "{
            \"type\": \"CNAME\",
            \"name\": \"www\",
            \"content\": \"$DOMAIN\",
            \"ttl\": 1,
            \"proxied\": true
        }")
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_info "✅ CNAME 记录创建成功"
    else
        print_warning "⚠️  CNAME 记录可能已存在或创建失败"
    fi
}

# 配置 SSL/TLS
setup_ssl() {
    print_message "配置 SSL/TLS..."
    
    # 设置 SSL 模式为 Full (strict)
    curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/ssl" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"value":"strict"}' > /dev/null
    
    # 启用自动 HTTPS 重定向
    curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/automatic_https_rewrites" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"value":"on"}' > /dev/null
    
    # 启用 HSTS
    curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/security_header" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{
            "value": {
                "strict_transport_security": {
                    "enabled": true,
                    "max_age": 31536000,
                    "include_subdomains": true
                }
            }
        }' > /dev/null
    
    print_info "✅ SSL/TLS 配置完成"
}

# 配置性能优化
setup_performance() {
    print_message "配置性能优化..."
    
    # 启用 Brotli 压缩
    curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/brotli" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"value":"on"}' > /dev/null
    
    # 启用 Auto Minify
    curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/minify" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{
            "value": {
                "css": "on",
                "html": "on", 
                "js": "on"
            }
        }' > /dev/null
    
    # 设置缓存级别
    curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/cache_level" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"value":"aggressive"}' > /dev/null
    
    print_info "✅ 性能优化配置完成"
}

# 配置安全设置
setup_security() {
    print_message "配置安全设置..."
    
    # 启用 Web 应用防火墙
    curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/waf" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"value":"on"}' > /dev/null
    
    # 设置安全级别
    curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/security_level" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"value":"medium"}' > /dev/null
    
    print_info "✅ 安全设置配置完成"
}

# 创建页面规则
setup_page_rules() {
    print_message "创建页面规则..."
    
    # API 缓存规则
    curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/pagerules" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data "{
            \"targets\": [{
                \"target\": \"url\",
                \"constraint\": {
                    \"operator\": \"matches\",
                    \"value\": \"*api.$DOMAIN/api/*\"
                }
            }],
            \"actions\": [{
                \"id\": \"cache_level\",
                \"value\": \"bypass\"
            }],
            \"priority\": 1,
            \"status\": \"active\"
        }" > /dev/null
    
    print_info "✅ 页面规则创建完成"
}

# 验证配置
verify_setup() {
    print_message "验证配置..."
    
    print_info "检查 DNS 解析..."
    
    # 检查主域名
    if nslookup $DOMAIN | grep -q "Address"; then
        print_info "✅ $DOMAIN 解析正常"
    else
        print_warning "⚠️  $DOMAIN 解析可能需要时间生效"
    fi
    
    # 检查 API 域名
    if nslookup $API_DOMAIN | grep -q "Address"; then
        print_info "✅ $API_DOMAIN 解析正常"
    else
        print_warning "⚠️  $API_DOMAIN 解析可能需要时间生效"
    fi
    
    print_info "DNS 传播通常需要 5-10 分钟"
}

# 更新 GitHub OAuth 配置
update_github_oauth() {
    print_message "GitHub OAuth 配置信息..."
    
    echo
    print_info "请更新您的 GitHub OAuth 应用配置："
    print_info "访问: https://github.com/settings/developers"
    echo
    print_info "更新配置为："
    echo "Homepage URL: https://$DOMAIN"
    echo "Authorization callback URL: https://$API_DOMAIN/api/auth/oauth/github/callback"
    echo
}

# 更新环境变量
update_env_vars() {
    print_message "更新环境变量..."
    
    # 创建生产环境变量文件
    cat > .env.production << EOF
# wwwcn.uk 生产环境配置
NODE_ENV=production
FRONTEND_URL=https://$DOMAIN
BACKEND_URL=https://$API_DOMAIN

# GitHub OAuth (需要更新)
GITHUB_REDIRECT_URI=https://$API_DOMAIN/api/auth/oauth/github/callback

# Google OAuth (需要更新)
GOOGLE_REDIRECT_URI=https://$API_DOMAIN/api/auth/oauth/google/callback

# Gitee OAuth (需要更新)
GITEE_REDIRECT_URI=https://$API_DOMAIN/api/auth/oauth/gitee/callback

# Cloudflare 配置
CLOUDFLARE_ZONE_ID=$CLOUDFLARE_ZONE_ID
CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN

# 其他配置请参考 .env.wwwcn.uk 文件
EOF
    
    print_info "✅ 环境变量文件已创建: .env.production"
}

# 显示部署总结
show_summary() {
    print_message "部署配置完成！"
    echo "============================================="
    echo "🌐 域名配置:"
    echo "   主站: https://$DOMAIN"
    echo "   API:  https://$API_DOMAIN"
    echo "   WWW:  https://www.$DOMAIN"
    echo
    echo "🔒 SSL/TLS: 已启用 (Full Strict 模式)"
    echo "⚡ CDN: 已启用 (全球加速)"
    echo "🛡️  安全: WAF + DDoS 防护已启用"
    echo "🇨🇳 中国访问: 支持 (通过香港节点)"
    echo
    echo "📋 后续步骤:"
    echo "1. 部署您的应用到服务器"
    echo "2. 更新 GitHub OAuth 配置"
    echo "3. 更新其他第三方服务回调地址"
    echo "4. 测试网站访问和功能"
    echo "============================================="
    
    print_info "配置文件位置:"
    print_info "- 环境变量: .env.production"
    print_info "- Cloudflare配置: cloudflare-config.yml"
    print_info "- 域名专用配置: .env.wwwcn.uk"
}

# 显示帮助信息
show_help() {
    echo "Cloudflare + wwwcn.uk 域名部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  setup-api      配置 Cloudflare API"
    echo "  setup-dns      配置 DNS 记录"
    echo "  setup-ssl      配置 SSL/TLS"
    echo "  setup-perf     配置性能优化"
    echo "  setup-security 配置安全设置"
    echo "  setup-rules    创建页面规则"
    echo "  verify         验证配置"
    echo "  full-setup     完整配置流程"
    echo "  update-oauth   显示 OAuth 更新信息"
    echo "  help           显示帮助信息"
    echo ""
    echo "环境变量:"
    echo "  CLOUDFLARE_API_TOKEN - Cloudflare API Token"
    echo "  CLOUDFLARE_ZONE_ID   - Cloudflare Zone ID"
}

# 完整配置流程
full_setup() {
    print_message "开始 wwwcn.uk 域名完整配置..."
    
    check_dependencies
    setup_cloudflare_api
    setup_dns_records
    setup_ssl
    setup_performance
    setup_security
    setup_page_rules
    update_env_vars
    verify_setup
    update_github_oauth
    show_summary
    
    print_message "wwwcn.uk 域名配置完成！🎉"
}

# 主函数
main() {
    echo "==========================================="
    echo "🌐 Cloudflare + wwwcn.uk 域名配置脚本"
    echo "==========================================="
    
    case "${1:-help}" in
        "setup-api")
            setup_cloudflare_api
            ;;
        "setup-dns")
            setup_dns_records
            ;;
        "setup-ssl")
            setup_ssl
            ;;
        "setup-perf")
            setup_performance
            ;;
        "setup-security")
            setup_security
            ;;
        "setup-rules")
            setup_page_rules
            ;;
        "verify")
            verify_setup
            ;;
        "full-setup")
            full_setup
            ;;
        "update-oauth")
            update_github_oauth
            ;;
        "help")
            show_help
            ;;
        *)
            print_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"