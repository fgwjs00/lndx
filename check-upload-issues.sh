#!/bin/bash

echo "🔍 检查线上服务器图片上传问题..."
echo "=================================="

# 1. 检查上传目录
echo "1. 检查上传目录:"
UPLOAD_DIR="/www/wwwroot/lndx/backend/uploads/id-cards"
if [ -d "$UPLOAD_DIR" ]; then
    echo "   ✅ 目录存在: $UPLOAD_DIR"
    ls -la "$UPLOAD_DIR" | head -5
    echo "   📊 目录权限: $(stat -c '%A %U:%G' $UPLOAD_DIR)"
else
    echo "   ❌ 目录不存在，正在创建..."
    mkdir -p "$UPLOAD_DIR"
    chmod 755 "$UPLOAD_DIR"
    chown www:www "$UPLOAD_DIR"
    echo "   ✅ 目录已创建: $UPLOAD_DIR"
fi

# 2. 检查磁盘空间
echo ""
echo "2. 检查磁盘空间:"
df -h /www/wwwroot/lndx/

# 3. 检查Nginx进程和配置
echo ""
echo "3. 检查Nginx状态:"
systemctl status nginx --no-pager -l

# 4. 检查后端进程
echo ""
echo "4. 检查后端进程:"
pm2 status

# 5. 测试文件访问权限
echo ""
echo "5. 测试文件访问权限:"
touch "$UPLOAD_DIR/test-file.txt"
if [ $? -eq 0 ]; then
    echo "   ✅ 可以创建文件"
    rm "$UPLOAD_DIR/test-file.txt"
else
    echo "   ❌ 无法创建文件，权限问题"
fi

# 6. 检查最近的上传文件
echo ""
echo "6. 最近上传的文件:"
find "$UPLOAD_DIR" -type f -mtime -1 -exec ls -la {} \; 2>/dev/null | head -5

# 7. 检查Nginx配置中的uploads配置
echo ""
echo "7. 检查Nginx uploads配置:"
grep -n "uploads" /www/server/panel/vhost/nginx/*.conf 2>/dev/null || echo "   ⚠️ 未找到uploads配置"

echo ""
echo "🎯 检查完成！"
