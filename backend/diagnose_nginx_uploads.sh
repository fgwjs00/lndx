#!/bin/bash
# 诊断Nginx静态文件服务问题

echo "🔍 诊断图片访问问题..."

echo -e "\n📁 1. 检查文件是否存在:"
ls -la uploads/id-cards/ | head -10

echo -e "\n🔍 2. 检查具体文件:"
TARGET_FILE="uploads/id-cards/idcard_739191b9-86f1-4402-828a-81105948441f.jpg"
if [ -f "$TARGET_FILE" ]; then
    echo "✅ 文件存在: $TARGET_FILE"
    ls -la "$TARGET_FILE"
else
    echo "❌ 文件不存在: $TARGET_FILE"
    echo "🔍 查找类似文件名:"
    find uploads/ -name "*739191b9*" 2>/dev/null || echo "未找到相关文件"
fi

echo -e "\n🌐 3. 检查Nginx配置:"
echo "🔍 查找包含uploads的Nginx配置:"
grep -r "uploads" /www/server/nginx/conf/ 2>/dev/null || echo "未找到uploads相关配置"

echo -e "\n🔍 4. 检查Nginx站点配置:"
SITE_CONFIG="/www/server/nginx/conf/vhost/ln.tuojiaya.com.conf"
if [ -f "$SITE_CONFIG" ]; then
    echo "✅ 找到站点配置: $SITE_CONFIG"
    echo "🔍 配置内容:"
    cat "$SITE_CONFIG"
else
    echo "❌ 未找到站点配置文件"
    echo "🔍 列出所有站点配置:"
    ls -la /www/server/nginx/conf/vhost/ 2>/dev/null || echo "无法访问配置目录"
fi

echo -e "\n📊 5. 检查Nginx访问日志:"
echo "🔍 最近的访问记录:"
tail -5 /www/server/nginx/logs/access.log 2>/dev/null | grep -i uploads || echo "未找到uploads相关访问记录"

echo -e "\n🚨 6. 检查Nginx错误日志:"
echo "🔍 最近的错误记录:"
tail -5 /www/server/nginx/logs/error.log 2>/dev/null | grep -i uploads || echo "未找到uploads相关错误记录"

echo -e "\n🔧 7. 建议的修复方案:"
echo "方案1: 在Nginx配置中添加静态文件服务"
echo "方案2: 确保后端服务正在运行并正确代理"
echo "方案3: 检查防火墙设置"

echo -e "\n✅ 诊断完成!"
