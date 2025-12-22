#!/bin/bash

echo "=== 性能测试脚本 ==="
echo "测试AI分析API的响应速度"
echo ""

# 测试原始API
echo "1. 测试原始API (mastra-analysis-ws)..."
time curl -s "http://localhost:3000/api/ai/mastra-analysis-ws?symbol=BTC" > /dev/null
echo ""

# 测试优化版API
echo "2. 测试优化版API (mastra-analysis-optimized)..."
time curl -s "http://localhost:3000/api/ai/mastra-analysis-optimized?symbol=BTC" > /dev/null
echo ""

# 测试缓存版API
echo "3. 测试缓存版API (mastra-analysis-cached)..."
time curl -s "http://localhost:3000/api/ai/mastra-analysis-cached?symbol=BTC" > /dev/null
echo ""

# 测试超快版API
echo "4. 测试超快版API (mastra-analysis-fast)..."
time curl -s "http://localhost:3000/api/ai/mastra-analysis-fast?symbol=BTC" > /dev/null
echo ""

echo "=== 测试完成 ==="
echo "注意：如果服务器未启动，请先启动项目"
echo "建议：使用 pm2-start-with-timer.sh 启动完整环境"