#!/bin/bash
# 创建测试图片以验证静态文件服务

echo "🧪 创建测试图片..."

# 确保目录存在
mkdir -p uploads/id-cards
mkdir -p uploads/test

# 创建一个简单的测试文件
echo "This is a test file for uploads" > uploads/test/test.txt

# 创建一个小的测试图片（如果有imagemagick）
if command -v convert >/dev/null 2>&1; then
    convert -size 100x100 xc:red uploads/test/test.jpg
    echo "✅ 创建测试图片: uploads/test/test.jpg"
else
    # 复制一个现有图片作为测试（如果存在）
    if [ -f "uploads/id-cards/"*.jpg ]; then
        cp uploads/id-cards/*.jpg uploads/test/test.jpg 2>/dev/null
        echo "✅ 复制现有图片作为测试"
    fi
fi

# 设置正确权限
chown -R www:www uploads/
chmod -R 755 uploads/

echo "🔍 测试文件列表:"
ls -la uploads/test/

echo -e "\n🌐 测试URL:"
echo "http://ln.tuojiaya.com/uploads/test/test.txt"
echo "http://ln.tuojiaya.com/uploads/test/test.jpg"

echo -e "\n✅ 测试文件创建完成!"
echo "请在浏览器中访问上述URL测试静态文件服务"
