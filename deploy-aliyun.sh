#!/bin/bash

# ==============================================
# 阿里云自动化部署脚本
# 支持ECS、函数计算、容器服务等部署方式
# ==============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 阿里云配置
ALIYUN_REGION="cn-hangzhou"
ECS_IMAGE_ID="centos_7_9_x64_20G_alibase_20210318.vhd"
INSTANCE_TYPE="ecs.t5-lc1m1.small"

print_message() {
    echo -e "${GREEN}[阿里云部署] $1${NC}"
}

print_error() {
    echo -e "${RED}[错误] $1${NC}"
}

print_info() {
    echo -e "${BLUE}[信息] $1${NC}"
}

# 检查阿里云CLI
check_aliyun_cli() {
    print_message "检查阿里云CLI工具..."
    
    if ! command -v aliyun &> /dev/null; then
        print_info "安装阿里云CLI..."
        
        # 根据系统类型下载安装
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            wget https://aliyuncli.alicdn.com/aliyun-cli-linux-latest-amd64.tgz
            tar xzvf aliyun-cli-linux-latest-amd64.tgz
            sudo mv aliyun /usr/local/bin/
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            curl -L https://aliyuncli.alicdn.com/aliyun-cli-macos-latest-amd64.tgz -o aliyun-cli.tgz
            tar xzvf aliyun-cli.tgz
            sudo mv aliyun /usr/local/bin/
        fi
    fi
    
    print_info "配置阿里云认证..."
    print_info "请输入您的AccessKey ID和Secret"
    aliyun configure
}

# 创建ECS实例
create_ecs_instance() {
    print_message "创建ECS云服务器..."
    
    # 创建安全组
    SECURITY_GROUP_ID=$(aliyun ecs CreateSecurityGroup \
        --RegionId $ALIYUN_REGION \
        --GroupName "trade-platform-sg" \
        --Description "交易平台安全组" \
        --query 'SecurityGroupId' --output text)
    
    print_info "安全组创建成功: $SECURITY_GROUP_ID"
    
    # 添加安全组规则
    aliyun ecs AuthorizeSecurityGroup \
        --RegionId $ALIYUN_REGION \
        --SecurityGroupId $SECURITY_GROUP_ID \
        --IpProtocol tcp \
        --PortRange "22/22" \
        --SourceCidrIp "0.0.0.0/0" \
        --Description "SSH访问"
        
    aliyun ecs AuthorizeSecurityGroup \
        --RegionId $ALIYUN_REGION \
        --SecurityGroupId $SECURITY_GROUP_ID \
        --IpProtocol tcp \
        --PortRange "80/80" \
        --SourceCidrIp "0.0.0.0/0" \
        --Description "HTTP访问"
        
    aliyun ecs AuthorizeSecurityGroup \
        --RegionId $ALIYUN_REGION \
        --SecurityGroupId $SECURITY_GROUP_ID \
        --IpProtocol tcp \
        --PortRange "443/443" \
        --SourceCidrIp "0.0.0.0/0" \
        --Description "HTTPS访问"
        
    aliyun ecs AuthorizeSecurityGroup \
        --RegionId $ALIYUN_REGION \
        --SecurityGroupId $SECURITY_GROUP_ID \
        --IpProtocol tcp \
        --PortRange "5000/5000" \
        --SourceCidrIp "0.0.0.0/0" \
        --Description "应用端口"
    
    # 创建ECS实例
    INSTANCE_ID=$(aliyun ecs CreateInstance \
        --RegionId $ALIYUN_REGION \
        --ImageId $ECS_IMAGE_ID \
        --InstanceType $INSTANCE_TYPE \
        --SecurityGroupId $SECURITY_GROUP_ID \
        --InstanceName "trade-platform" \
        --Description "交易平台服务器" \
        --InternetMaxBandwidthOut 1 \
        --query 'InstanceId' --output text)
    
    print_info "ECS实例创建成功: $INSTANCE_ID"
    
    # 启动实例
    aliyun ecs StartInstance --InstanceId $INSTANCE_ID
    
    # 分配公网IP
    aliyun ecs AllocatePublicIpAddress --InstanceId $INSTANCE_ID
    
    # 获取公网IP
    PUBLIC_IP=$(aliyun ecs DescribeInstances \
        --InstanceIds "[$INSTANCE_ID]" \
        --query 'Instances.Instance[0].PublicIpAddress.IpAddress[0]' --output text)
    
    print_message "ECS实例部署完成"
    print_info "实例ID: $INSTANCE_ID"
    print_info "公网IP: $PUBLIC_IP"
    print_info "SSH连接: ssh root@$PUBLIC_IP"
    
    # 保存实例信息
    echo "INSTANCE_ID=$INSTANCE_ID" > .aliyun-deployment
    echo "PUBLIC_IP=$PUBLIC_IP" >> .aliyun-deployment
    echo "SECURITY_GROUP_ID=$SECURITY_GROUP_ID" >> .aliyun-deployment
}

# 创建RDS数据库
create_rds_database() {
    print_message "创建RDS云数据库..."
    
    DB_INSTANCE_ID=$(aliyun rds CreateDBInstance \
        --RegionId $ALIYUN_REGION \
        --Engine "PostgreSQL" \
        --EngineVersion "13.0" \
        --DBInstanceClass "pg.n2.small.1" \
        --DBInstanceStorage 20 \
        --DBInstanceNetType "Intranet" \
        --PayType "Postpaid" \
        --DBInstanceDescription "交易平台数据库" \
        --query 'DBInstanceId' --output text)
    
    print_info "RDS实例创建成功: $DB_INSTANCE_ID"
    
    # 等待实例可用
    print_info "等待数据库实例启动..."
    sleep 60
    
    # 创建账号
    aliyun rds CreateAccount \
        --DBInstanceId $DB_INSTANCE_ID \
        --AccountName "tradeuser" \
        --AccountPassword "TradePass123!" \
        --AccountType "Super"
    
    # 创建数据库
    aliyun rds CreateDatabase \
        --DBInstanceId $DB_INSTANCE_ID \
        --DBName "trade_platform" \
        --CharacterSetName "UTF8"
    
    # 获取内网连接地址
    DB_CONNECTION=$(aliyun rds DescribeDBInstanceNetInfo \
        --DBInstanceId $DB_INSTANCE_ID \
        --query 'DBInstanceNetInfos.DBInstanceNetInfo[0].ConnectionString' --output text)
    
    print_message "RDS数据库创建完成"
    print_info "实例ID: $DB_INSTANCE_ID" 
    print_info "连接地址: $DB_CONNECTION"
    
    # 保存数据库信息
    echo "DB_INSTANCE_ID=$DB_INSTANCE_ID" >> .aliyun-deployment
    echo "DB_CONNECTION=$DB_CONNECTION" >> .aliyun-deployment
}

# 部署应用到ECS
deploy_to_ecs() {
    print_message "部署应用到ECS..."
    
    # 读取ECS信息
    source .aliyun-deployment
    
    print_info "连接ECS实例: $PUBLIC_IP"
    
    # 创建部署脚本
    cat > deploy_script.sh << 'EOF'
#!/bin/bash

# 更新系统
yum update -y

# 安装Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 安装Git
yum install -y git

# 安装PM2
npm install -g pm2

# 创建应用目录
mkdir -p /app
cd /app

# 克隆代码（需要先推送到Git仓库）
# git clone https://github.com/your-username/trade-platform.git .

echo "ECS环境准备完成"
EOF

    # 上传并执行部署脚本
    scp deploy_script.sh root@$PUBLIC_IP:/tmp/
    ssh root@$PUBLIC_IP "chmod +x /tmp/deploy_script.sh && /tmp/deploy_script.sh"
    
    # 清理临时文件
    rm deploy_script.sh
    
    print_message "ECS部署完成"
}

# 配置负载均衡
setup_slb() {
    print_message "配置负载均衡..."
    
    # 创建负载均衡实例
    SLB_ID=$(aliyun slb CreateLoadBalancer \
        --RegionId $ALIYUN_REGION \
        --LoadBalancerName "trade-platform-slb" \
        --AddressType "internet" \
        --InternetChargeType "paybytraffic" \
        --query 'LoadBalancerId' --output text)
    
    print_info "负载均衡创建成功: $SLB_ID"
    
    # 添加后端服务器
    source .aliyun-deployment
    aliyun slb AddBackendServers \
        --LoadBalancerId $SLB_ID \
        --BackendServers "[{\"ServerId\":\"$INSTANCE_ID\",\"Weight\":100}]"
    
    # 创建监听器
    aliyun slb CreateLoadBalancerHTTPListener \
        --LoadBalancerId $SLB_ID \
        --ListenerPort 80 \
        --BackendServerPort 5000 \
        --Bandwidth -1 \
        --HealthCheck on \
        --HealthCheckURI "/api/health"
    
    # 启动监听器
    aliyun slb StartLoadBalancerListener \
        --LoadBalancerId $SLB_ID \
        --ListenerPort 80
    
    # 获取负载均衡IP
    SLB_IP=$(aliyun slb DescribeLoadBalancers \
        --LoadBalancerIds "[$SLB_ID]" \
        --query 'LoadBalancers.LoadBalancer[0].Address' --output text)
    
    print_message "负载均衡配置完成"
    print_info "负载均衡ID: $SLB_ID"
    print_info "访问地址: http://$SLB_IP"
    
    # 保存SLB信息
    echo "SLB_ID=$SLB_ID" >> .aliyun-deployment
    echo "SLB_IP=$SLB_IP" >> .aliyun-deployment
}

# 配置OSS对象存储
setup_oss() {
    print_message "配置OSS对象存储..."
    
    BUCKET_NAME="trade-platform-files-$(date +%s)"
    
    # 创建Bucket
    aliyun oss mb oss://$BUCKET_NAME --region $ALIYUN_REGION
    
    print_info "OSS Bucket创建成功: $BUCKET_NAME"
    
    # 保存OSS信息
    echo "OSS_BUCKET=$BUCKET_NAME" >> .aliyun-deployment
}

# 设置域名解析
setup_dns() {
    print_message "配置域名解析..."
    
    read -p "请输入您的域名（如：your-domain.com）: " DOMAIN_NAME
    
    if [ -n "$DOMAIN_NAME" ]; then
        source .aliyun-deployment
        
        # 添加A记录
        aliyun domain AddDomainRecord \
            --DomainName $DOMAIN_NAME \
            --RR "@" \
            --Type "A" \
            --Value $SLB_IP
            
        # 添加API子域名
        aliyun domain AddDomainRecord \
            --DomainName $DOMAIN_NAME \
            --RR "api" \
            --Type "A" \
            --Value $SLB_IP
        
        print_info "域名解析配置完成"
        print_info "网站访问: http://$DOMAIN_NAME"
        print_info "API访问: http://api.$DOMAIN_NAME"
    fi
}

# 显示部署信息
show_deployment_info() {
    print_message "部署信息汇总"
    echo "=================================="
    
    if [ -f .aliyun-deployment ]; then
        source .aliyun-deployment
        
        echo "ECS实例: $INSTANCE_ID"
        echo "公网IP: $PUBLIC_IP"
        echo "数据库: $DB_INSTANCE_ID"
        echo "连接地址: $DB_CONNECTION"
        echo "负载均衡: $SLB_ID"
        echo "访问地址: http://$SLB_IP"
        echo "OSS存储: $OSS_BUCKET"
    fi
    
    echo "=================================="
    print_info "部署完成！请配置环境变量并启动应用"
}

# 清理资源
cleanup_resources() {
    print_message "清理阿里云资源..."
    
    if [ -f .aliyun-deployment ]; then
        source .aliyun-deployment
        
        # 删除ECS实例
        if [ -n "$INSTANCE_ID" ]; then
            aliyun ecs StopInstance --InstanceId $INSTANCE_ID --ForceStop true
            sleep 30
            aliyun ecs DeleteInstance --InstanceId $INSTANCE_ID --Force true
        fi
        
        # 删除安全组
        if [ -n "$SECURITY_GROUP_ID" ]; then
            aliyun ecs DeleteSecurityGroup --SecurityGroupId $SECURITY_GROUP_ID
        fi
        
        # 删除RDS实例
        if [ -n "$DB_INSTANCE_ID" ]; then
            aliyun rds DeleteDBInstance --DBInstanceId $DB_INSTANCE_ID --DBInstanceDeleteType Immediate
        fi
        
        # 删除负载均衡
        if [ -n "$SLB_ID" ]; then
            aliyun slb DeleteLoadBalancer --LoadBalancerId $SLB_ID
        fi
        
        # 删除OSS Bucket（需要先清空）
        if [ -n "$OSS_BUCKET" ]; then
            aliyun oss rm oss://$OSS_BUCKET --recursive --force
        fi
        
        rm -f .aliyun-deployment
        print_message "资源清理完成"
    fi
}

# 显示帮助信息
show_help() {
    echo "阿里云部署脚本使用说明"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  init           初始化环境和CLI工具"
    echo "  create-ecs     创建ECS云服务器"
    echo "  create-rds     创建RDS云数据库"
    echo "  deploy-app     部署应用到ECS"
    echo "  setup-slb      配置负载均衡"
    echo "  setup-oss      配置对象存储"
    echo "  setup-dns      配置域名解析"
    echo "  full-deploy    完整部署流程"
    echo "  show-info      显示部署信息"
    echo "  cleanup        清理所有资源"
    echo "  help           显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 init"
    echo "  $0 full-deploy"
    echo "  $0 cleanup"
}

# 完整部署流程
full_deploy() {
    print_message "开始完整部署流程..."
    
    check_aliyun_cli
    create_ecs_instance
    create_rds_database
    setup_slb
    setup_oss
    deploy_to_ecs
    setup_dns
    show_deployment_info
    
    print_message "完整部署流程完成！🎉"
}

# 主函数
main() {
    echo "==========================================="
    echo "🚀 阿里云自动化部署脚本"
    echo "==========================================="
    
    case "${1:-help}" in
        "init")
            check_aliyun_cli
            ;;
        "create-ecs")
            create_ecs_instance
            ;;
        "create-rds")
            create_rds_database
            ;;
        "deploy-app")
            deploy_to_ecs
            ;;
        "setup-slb")
            setup_slb
            ;;
        "setup-oss")
            setup_oss
            ;;
        "setup-dns")
            setup_dns
            ;;
        "full-deploy")
            full_deploy
            ;;
        "show-info")
            show_deployment_info
            ;;
        "cleanup")
            cleanup_resources
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