#!/bin/bash

# PM2启动脚本 - 包含主应用和智能交易定时器

echo "=== 启动AI智能交易系统 ==="

# 检查环境变量
if [ -z "$DEEPSEEK_KEY" ]; then
    echo "错误: DEEPSEEK_KEY 环境变量未设置"
    exit 1
fi

if [ -z "$BINANCE_API_KEY" ] || [ -z "$BINANCE_SECRET_KEY" ]; then
    echo "错误: BINANCE_API_KEY 或 BINANCE_SECRET_KEY 环境变量未设置"
    exit 1
fi

# 检查pnpm是否安装
if ! command -v pnpm &> /dev/null; then
    echo "安装pnpm..."
    npm install -g pnpm
fi

# 安装依赖
echo "安装项目依赖..."
pnpm install

# 构建项目
echo "构建项目..."
pnpm build

# 确保日志目录存在
mkdir -p logs

# 停止现有的PM2进程
echo "停止现有的PM2进程..."
pm2 stop ecosystem.config.js 2>/dev/null || true
pm2 delete ecosystem.config.js 2>/dev/null || true

# 启动PM2进程
echo "启动PM2进程..."
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save

# 显示状态
echo "=== 进程状态 ==="
pm2 status

echo "=== 启动完成 ==="
echo "主应用将在端口3000运行"
echo "智能交易定时器将每5分钟执行一次"
echo "日志文件位于 logs/ 目录下"
echo ""
echo "常用命令:"
echo "  pm2 status          - 查看进程状态"
echo "  pm2 logs            - 查看所有日志"
echo "  pm2 logs niuma996   - 查看主应用日志"
echo "  pm2 logs smart-trade-timer - 查看定时器日志"
echo "  pm2 stop all        - 停止所有进程"
echo "  pm2 restart all     - 重启所有进程"