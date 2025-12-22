#!/bin/bash

# 确保日志目录存在
mkdir -p logs

# 安装依赖
pnpm install

# 构建项目
pnpm build

# 启动PM2
pm2 start ecosystem.config.js --env production

# 保存PM2配置
pm2 save

# 启动PM2开机自启
pm2 startup