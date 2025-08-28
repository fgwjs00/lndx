#!/bin/bash

echo "🔍 诊断Nginx静态文件访问问题..."
echo "=================================="

# 1. 检查上传目录
UPLOAD_DIR="/www/wwwroot/lndx/backend/uploads"
echo "1. 检查上传目录："
if [ -d "$UPLOAD_DIR" ]; then
    echo "   ✅ 目录存在: $UPLOAD_DIR"
    echo "   📊 目录权限: $(ls -ld $UPLOAD_DIR)"
    echo "   📁 子目录:"
    ls -la "$UPLOAD_DIR"
else
    echo "   ❌ 目录不存在: $UPLOAD_DIR"
fi

# 2. 检查id-cards目录
ID_CARDS_DIR="$UPLOAD_DIR/id-cards"
echo ""
echo "2. 检查id-cards目录："
if [ -d "$ID_CARDS_DIR" ]; then
    echo "   ✅ 目录存在: $ID_CARDS_DIR"
    echo "   📊 目录权限: $(ls -ld $ID_CARDS_DIR)"
    echo "   📄 文件数量: $(find $ID_CARDS_DIR -type f | wc -l)"
    echo "   📄 最新文件:"
    ls -lat "$ID_CARDS_DIR" | head -3
else
    echo "   ❌ 目录不存在: $ID_CARDS_DIR"
fi

# 3. 测试Nginx配置
echo ""
echo "3. 测试Nginx配置："
nginx -t 2>&1

# 4. 检查Nginx进程
echo ""
echo "4. 检查Nginx进程："
ps aux | grep nginx | grep -v grep

# 5. 检查端口监听
echo ""
echo "5. 检查端口监听："
netstat -tlnp | grep :80

# 6. 创建测试文件
TEST_FILE="$ID_CARDS_DIR/test-static.txt"
echo ""
echo "6. 创建测试文件："
mkdir -p "$ID_CARDS_DIR"
echo "This is a test file" > "$TEST_FILE"
chmod 644 "$TEST_FILE"
chown www:www "$TEST_FILE"
echo "   ✅ 测试文件已创建: $TEST_FILE"

# 7. 测试文件访问
echo ""
echo "7. 测试文件访问："
echo "   🌐 请在浏览器中访问: http://ln.tuojiayi.com/uploads/id-cards/test-static.txt"
echo "   📱 或使用curl测试: curl -I http://ln.tuojiayi.com/uploads/id-cards/test-static.txt"

echo ""
echo "🎯 诊断完成！"
