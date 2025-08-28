#!/bin/bash
# 检查服务状态

echo "🔍 检查服务状态..."

echo -e "\n📊 1. PM2进程状态:"
pm2 status

echo -e "\n🌐 2. Nginx状态:"
systemctl status nginx --no-pager -l

echo -e "\n🔌 3. 端口监听状态:"
netstat -tlnp | grep -E ":80|:3001|:443"

echo -e "\n🧪 4. 测试本地后端连接:"
curl -I http://localhost:3001/api/health 2>/dev/null || echo "❌ 后端服务无响应"

echo -e "\n📝 5. 最近的Nginx错误日志:"
tail -5 /www/server/nginx/logs/error.log 2>/dev/null || echo "无法读取错误日志"

echo -e "\n🔧 6. 如果后端服务未运行，重启命令:"
echo "cd /www/wwwroot/lndx/backend && pm2 start ecosystem.config.js"

echo -e "\n✅ 检查完成!"
