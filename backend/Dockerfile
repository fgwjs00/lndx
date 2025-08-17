# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 复制package.json和pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile --production

# 复制源代码
COPY . .

# 生成Prisma客户端
RUN pnpm prisma:generate

# 构建应用
RUN pnpm build

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S lndx -u 1001

# 更改文件所有者
RUN chown -R lndx:nodejs /app
USER lndx

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# 启动应用
CMD ["pnpm", "start"]

