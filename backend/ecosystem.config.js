/**
 * PM2配置文件
 * @description 生产环境进程管理配置
 */

module.exports = {
  apps: [
    {
      name: 'lndx-backend',
      script: 'dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001
      },
      // 日志配置
      log_file: './logs/pm2.log',
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // 自动重启配置
      max_restarts: 10,
      min_uptime: '10s',
      
      // 健康检查
      health_check: {
        url: 'http://localhost:3000/health',
        interval: 30000,
        timeout: 5000
      },
      
      // 进程监控
      monitoring: false,
      
      // 启动延迟
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      
      // 环境变量
      env_file: '.env',
      
      // 忽略监听文件
      ignore_watch: [
        'node_modules',
        'logs',
        'uploads',
        'dist',
        '.git'
      ],
      
      // 重启条件
      restart_delay: 4000,
      autorestart: true,
      
      // 集群配置
      instance_var: 'INSTANCE_ID',
      
      // 进程标识
      pid_file: './logs/lndx-backend.pid',
      
      // 启动后执行的命令
      post_update: [
        'npm run build',
        'npm run prisma:deploy'
      ]
    }
  ],

  // 部署配置
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-production-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/lndx-backend.git',
      path: '/var/www/lndx-backend',
      'post-deploy': 'pnpm install && pnpm build && pnpm prisma:deploy && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /var/www/lndx-backend/logs',
      'post-setup': 'echo "Deploy setup complete"'
    },
    staging: {
      user: 'deploy',
      host: 'your-staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-repo/lndx-backend.git',
      path: '/var/www/lndx-backend-staging',
      'post-deploy': 'pnpm install && pnpm build && pnpm prisma:deploy && pm2 reload ecosystem.config.js --env staging'
    }
  }
}

