#!/bin/bash
# 测试路径映射是否正确

echo "🧪 测试Nginx路径映射..."

TARGET_FILE="idcard_739191b9-86f1-4402-828a-81105948441f.jpg"

echo -e "\n📁 1. 检查文件在不同路径的存在情况:"
echo "🔍 当前目录 (backend/):"
pwd
ls -la uploads/id-cards/$TARGET_FILE 2>/dev/null && echo "✅ 文件存在于相对路径" || echo "❌ 文件不存在于相对路径"

echo -e "\n🔍 绝对路径:"
ABSOLUTE_PATH="/www/wwwroot/ln.tuojiaya.com/backend/uploads/id-cards/$TARGET_FILE"
ls -la "$ABSOLUTE_PATH" 2>/dev/null && echo "✅ 文件存在于绝对路径: $ABSOLUTE_PATH" || echo "❌ 文件不存在于绝对路径"

echo -e "\n🔍 Nginx alias目标路径:"
NGINX_PATH="/www/wwwroot/ln.tuojiaya.com/backend/uploads/id-cards/$TARGET_FILE"
ls -la "$NGINX_PATH" 2>/dev/null && echo "✅ Nginx路径正确: $NGINX_PATH" || echo "❌ Nginx路径不正确"

echo -e "\n🧪 2. 测试Nginx URL映射:"
echo "URL: /uploads/id-cards/$TARGET_FILE"
echo "应该映射到: $NGINX_PATH"

echo -e "\n📊 3. 创建简单测试文件验证映射:"
TEST_FILE="/www/wwwroot/ln.tuojiaya.com/backend/uploads/test.txt"
echo "This is a test file created at $(date)" > "$TEST_FILE"
chown www:www "$TEST_FILE"
chmod 644 "$TEST_FILE"

echo "✅ 测试文件已创建: $TEST_FILE"
echo "🌐 请访问: http://ln.tuojiaya.com/uploads/test.txt"

echo -e "\n🔧 4. 修复权限 (以防万一):"
chown -R www:www /www/wwwroot/ln.tuojiaya.com/backend/uploads/
chmod -R 755 /www/wwwroot/ln.tuojiaya.com/backend/uploads/
chmod 644 /www/wwwroot/ln.tuojiaya.com/backend/uploads/id-cards/*.jpg 2>/dev/null

echo -e "\n✅ 路径测试完成!"
echo "如果 test.txt 可以访问，说明Nginx配置正确"
echo "如果 test.txt 不能访问，说明alias路径配置有问题"
