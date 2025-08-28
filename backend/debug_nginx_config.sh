#!/bin/bash
# 深度诊断Nginx配置问题

echo "🔍 深度诊断Nginx静态文件服务问题..."

echo -e "\n📁 1. 确认文件确实存在:"
TARGET_FILE="uploads/id-cards/idcard_739191b9-86f1-4402-828a-81105948441f.jpg"
if [ -f "$TARGET_FILE" ]; then
    echo "✅ 文件确实存在: $TARGET_FILE"
    ls -la "$TARGET_FILE"
    echo "📄 文件大小: $(du -h "$TARGET_FILE" | cut -f1)"
else
    echo "❌ 文件不存在: $TARGET_FILE"
    echo "🔍 检查是否有隐藏字符或空格:"
    ls -la uploads/id-cards/ | grep -E "739191b9|86f1.*4402"
fi

echo -e "\n🌐 2. 测试Nginx配置语法:"
nginx -t

echo -e "\n🔍 3. 查看完整的Nginx站点配置:"
cat /www/server/nginx/conf/vhost/ln.tuojiaya.com.conf

echo -e "\n🔍 4. 检查Nginx主配置中的include:"
grep -n "include.*vhost" /www/server/nginx/conf/nginx.conf

echo -e "\n🧪 5. 模拟请求测试:"
echo "🔍 测试本地curl请求:"
curl -I "http://localhost/uploads/id-cards/idcard_739191b9-86f1-4402-828a-81105948441f.jpg" 2>/dev/null || echo "curl请求失败"

echo -e "\n🔍 6. 检查Nginx进程和监听端口:"
ps aux | grep nginx | grep -v grep
netstat -tlnp | grep :80

echo -e "\n📊 7. 实时监控Nginx访问日志:"
echo "🔍 监控访问日志 (最后5条):"
tail -5 /www/server/nginx/logs/access.log 2>/dev/null || echo "无法读取访问日志"

echo -e "\n🚨 8. 实时监控Nginx错误日志:"
echo "🔍 监控错误日志 (最后5条):"
tail -5 /www/server/nginx/logs/error.log 2>/dev/null || echo "无法读取错误日志"

echo -e "\n🔧 9. 生成测试用的Nginx配置:"
cat > /tmp/nginx_uploads_test.conf << 'EOF'
# 测试用的uploads配置
location /uploads/ {
    alias /www/wwwroot/ln.tuojiaya.com/backend/uploads/;
    
    # 简化配置，先测试基本功能
    location ~* \.(jpg|jpeg|png|gif|webp|svg)$ {
        expires 1d;
        add_header Cache-Control "public";
        access_log on;  # 开启日志以便调试
        error_log /www/server/nginx/logs/uploads_debug.log debug;
    }
    
    try_files $uri =404;
    
    # 调试信息
    add_header X-Debug-Path $uri;
    add_header X-Debug-Root $document_root;
}
EOF

echo "✅ 生成的测试配置已保存到 /tmp/nginx_uploads_test.conf"

echo -e "\n💡 建议的修复步骤:"
echo "1. 替换当前uploads配置为简化版本"
echo "2. 重启Nginx服务"
echo "3. 实时监控日志进行测试"
echo "4. 逐步添加配置选项"

echo -e "\n🎯 关键检查点:"
echo "- Nginx配置语法是否正确"
echo "- alias路径是否正确"
echo "- 文件权限是否正确"
echo "- 是否存在配置冲突"

echo -e "\n✅ 诊断完成!"
