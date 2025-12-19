module.exports = {
  apps: [
    {
      name: 'niuma996',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 'max',
      exec_mode: 'cluster',
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
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      // 重启配置
      max_restarts: 10,
      restart_delay: 4000,
      // 内存限制
      max_memory_restart: '1G'
    }
  ]
};