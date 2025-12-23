module.exports = {
  apps: [
    {
      name: 'niuma996-main',
      script: 'bun',
      args: 'run start',
      cwd: '/root/niuma996',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      // 日志配置
      error_file: './logs/main-err.log',
      out_file: './logs/main-out.log',
      log_file: './logs/main-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // 重启配置
      max_restarts: 10,
      restart_delay: 4000,
      min_uptime: '10s',
      // 内存限制
      max_memory_restart: '1G',
      // 健康检查
      health_check_url: 'http://localhost:3000/api/health',
      health_check_grace_period: 30000
    },
    {
      name: 'niuma996-timer',
      script: 'bun',
      args: 'run scripts/smart-trade-timer.js',
      cwd: '/root/niuma996',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production'
      },
      env_development: {
        NODE_ENV: 'development'
      },
      // 日志配置
      error_file: './logs/timer-err.log',
      out_file: './logs/timer-out.log',
      log_file: './logs/timer-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // 重启配置
      max_restarts: 5,
      restart_delay: 10000,
      min_uptime: '5s',
      // 内存限制
      max_memory_restart: '500M',
      // 依赖主应用启动完成
      wait_ready: true,
      listen_timeout: 30000,
      kill_timeout: 5000,
      // 定时任务专用配置
      autorestart: true,
      cron_restart: '0 */6 * * *' // 每6小时重启一次，防止内存泄漏
    }
  ],

  // PM2部署配置
  deploy: {
    production: {
      user: 'root',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'your-repo-url',
      path: '/root/niuma996',
      'post-deploy': 'bun install && bun run build && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};