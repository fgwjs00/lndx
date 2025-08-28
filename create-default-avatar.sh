#!/bin/bash

# 创建默认头像文件
AVATAR_DIR="/www/wwwroot/lndx/backend/uploads/id-cards"
AVATAR_FILE="$AVATAR_DIR/default-avatar.jpg"

echo "创建默认头像文件..."

# 确保目录存在
mkdir -p "$AVATAR_DIR"

# 创建SVG默认头像
cat > "$AVATAR_DIR/default-avatar.svg" << 'EOF'
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" fill="#e5e7eb"/>
  <circle cx="50" cy="35" r="15" fill="#9ca3af"/>
  <ellipse cx="50" cy="75" rx="25" ry="15" fill="#9ca3af"/>
</svg>
EOF

# 如果系统有ImageMagick，转换为JPG
if command -v convert &> /dev/null; then
    echo "使用ImageMagick转换SVG为JPG..."
    convert "$AVATAR_DIR/default-avatar.svg" -background white -flatten "$AVATAR_FILE"
    echo "✅ 默认头像JPG已创建"
else
    echo "⚠️  ImageMagick未安装，创建了SVG版本"
    # 复制SVG为JPG扩展名（某些情况下也能工作）
    cp "$AVATAR_DIR/default-avatar.svg" "$AVATAR_FILE"
fi

# 设置权限
chown www:www "$AVATAR_FILE"
chmod 644 "$AVATAR_FILE"

echo "🎉 默认头像创建完成：$AVATAR_FILE"
ls -la "$AVATAR_FILE"
