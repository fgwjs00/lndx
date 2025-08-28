#!/bin/bash

echo "🔍 图片上传问题完整诊断..."
echo "=================================="

# 1. 检查上传目录状态
UPLOAD_DIR="/www/wwwroot/lndx/backend/uploads/id-cards"
echo "1. 检查上传目录状态："
echo "   📊 目录权限: $(ls -ld $UPLOAD_DIR)"
echo "   📄 文件总数: $(find $UPLOAD_DIR -type f | wc -l)"
echo "   💾 目录大小: $(du -sh $UPLOAD_DIR)"

# 2. 检查最近上传的文件
echo ""
echo "2. 最近上传的文件（按时间排序）："
ls -lat "$UPLOAD_DIR" | head -10

# 3. 检查特定文件
PROBLEM_FILE="idcard_3004bb16-a831-4fda-9750-ad15928e8bab.jpg"
echo ""
echo "3. 检查问题文件："
if [ -f "$UPLOAD_DIR/$PROBLEM_FILE" ]; then
    echo "   ✅ 文件存在: $PROBLEM_FILE"
    ls -la "$UPLOAD_DIR/$PROBLEM_FILE"
else
    echo "   ❌ 文件不存在: $PROBLEM_FILE"
fi

# 4. 检查磁盘空间
echo ""
echo "4. 检查磁盘空间："
df -h /www/wwwroot/lndx/

# 5. 检查PM2进程和日志
echo ""
echo "5. 检查后端进程："
pm2 status | grep backend

# 6. 检查最近的后端日志
echo ""
echo "6. 最近的后端日志（上传相关）："
pm2 logs backend --lines 20 | grep -i -E "(upload|image|file|error)" | tail -10

# 7. 测试文件写入权限
echo ""
echo "7. 测试文件写入权限："
TEST_FILE="$UPLOAD_DIR/write-test-$(date +%s).tmp"
if echo "test" > "$TEST_FILE" 2>/dev/null; then
    echo "   ✅ 可以写入文件"
    rm "$TEST_FILE"
else
    echo "   ❌ 无法写入文件"
fi

# 8. 检查multer临时目录
echo ""
echo "8. 检查系统临时目录："
ls -la /tmp/ | grep -E "(upload|multer)" | head -5

# 9. 创建新的测试图片
echo ""
echo "9. 创建测试图片文件："
TEST_IMAGE="$UPLOAD_DIR/test-image-$(date +%s).jpg"
# 创建一个小的JPEG文件头
printf '\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00' > "$TEST_IMAGE"
echo "test image data" >> "$TEST_IMAGE"
printf '\xff\xd9' >> "$TEST_IMAGE"

if [ -f "$TEST_IMAGE" ]; then
    echo "   ✅ 测试图片已创建: $(basename $TEST_IMAGE)"
    echo "   🌐 测试访问: curl -I http://ln.tuojiayi.com/uploads/id-cards/$(basename $TEST_IMAGE)"
    chown www:www "$TEST_IMAGE"
    chmod 644 "$TEST_IMAGE"
else
    echo "   ❌ 无法创建测试图片"
fi

echo ""
echo "🎯 诊断完成！"
echo ""
echo "📋 建议的修复步骤："
echo "1. 重新构建前端: cd /www/wwwroot/lndx/frontend && pnpm build"
echo "2. 重启后端进程: pm2 restart backend"
echo "3. 测试新的图片上传功能"
echo "4. 检查Nginx访问日志: tail -f /www/wwwlogs/ln.tuojiayi.com*.log"
