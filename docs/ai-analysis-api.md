# AI分析API文档

## 概述

AI分析API提供了统一的接口，支持两种模式：
- **分析模式**：仅提供市场分析和交易建议
- **自动交易模式**：在分析基础上执行自动交易决策

## 接口地址

```
POST /api/ai/mastra-analysis
```

## 请求参数

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| symbol | string | 否 | 'BTC' | 交易对符号（如BTC、ETH） |
| enableAutoTrading | boolean | 否 | false | 是否启用自动交易模式 |
| confidenceThreshold | number | 否 | 0.7 | 置信度阈值（仅自动交易模式有效） |

## 请求示例

### 分析模式（默认）
```json
{
  "symbol": "BTC"
}
```

### 自动交易模式
```json
{
  "symbol": "BTC",
  "enableAutoTrading": true,
  "confidenceThreshold": 0.8
}
```

## 响应参数

### 成功响应

#### 分析模式
```json
{
  "success": true,
  "symbol": "BTC",
  "mode": "analysis_only",
  "analysis": "市场分析内容...",
  "technicalData": {
    "symbol": "BTC",
    "timeframes": ["1h", "4h", "1d"],
    "updateTime": "2024-01-01T12:00:00.000Z",
    "updateTimeBeijing": "2024-01-01 20:00:00"
  },
  "metadata": {
    "model": "deepseek-chat",
    "analysisTime": "2024-01-01T12:00:00.000Z",
    "analysisTimeBeijing": "2024-01-01 20:00:00",
    "framework": "mastra",
    "enableAutoTrading": false,
    "confidenceThreshold": 0.7
  }
}
```

#### 自动交易模式
```json
{
  "success": true,
  "symbol": "BTC",
  "mode": "auto_trading",
  "analysis": "AI分析内容...",
  "decision": {
    "action": "buy",
    "quantity": 0.001,
    "price": 50000,
    "orderType": "MARKET",
    "stopLoss": 49000,
    "takeProfit": 51000,
    "reason": "技术指标显示买入信号",
    "confidence": 0.85
  },
  "autoTrade": {
    "success": true,
    "orderId": "123456789",
    "executedPrice": 50000,
    "timestamp": "2024-01-01T12:00:00.000Z",
    "timestampBeijing": "2024-01-01 20:00:00"
  },
  "confidence": 0.85,
  "technicalData": {
    "symbol": "BTC",
    "timeframes": ["1h", "4h", "1d"],
    "updateTime": "2024-01-01T12:00:00.000Z",
    "updateTimeBeijing": "2024-01-01 20:00:00"
  },
  "metadata": {
    "model": "deepseek-chat",
    "analysisTime": "2024-01-01T12:00:00.000Z",
    "analysisTimeBeijing": "2024-01-01 20:00:00",
    "framework": "mastra",
    "enableAutoTrading": true,
    "confidenceThreshold": 0.8
  }
}
```

### 错误响应

```json
{
  "error": "错误信息",
  "status": 500
}
```

## 交易决策规则

### 自动交易模式
- **置信度要求**：决策置信度必须大于阈值（默认0.7）
- **操作类型**：buy（买入）、sell（卖出）、close（平仓）、add（加仓）、reduce（减仓）、hold（持有）
- **风险控制**：必须设置止损价格
- **订单类型**：支持MARKET（市价）和LIMIT（限价）

### 分析模式
- 提供详细的市场趋势分析
- 给出关键支撑位和阻力位
- 解读技术指标
- 提供交易建议和风险控制建议

## 环境变量配置

```bash
# DeepSeek API密钥（必需）
DEEPSEEK_KEY=your_deepseek_api_key

# 提示词文件配置
PROMPTS_DIR="./prompts"
MASTRA_AUTO_PROMPT_FILE="trading_prompt.txt"
```

## 使用场景

### Web前端调用（分析模式）
```javascript
const response = await fetch('/api/ai/mastra-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ symbol: 'ETH' })
});
const result = await response.json();
console.log('AI分析结果:', result.analysis);
```

### 定时器调用（自动交易模式）
```javascript
const response = await fetch('/api/ai/mastra-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    symbol: 'BTC',
    enableAutoTrading: true,
    confidenceThreshold: 0.8 
  })
});
const result = await response.json();
if (result.autoTrade?.success) {
  console.log('自动交易执行成功:', result.autoTrade.orderId);
}
```

## 更新日志

### 2024-01-01
- 合并mastra-analysis和mastra-analysis-auto接口
- 添加enableAutoTrading参数控制交易模式
- 优化响应数据结构
- 统一错误处理机制