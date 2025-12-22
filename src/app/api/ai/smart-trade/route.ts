import { NextResponse } from 'server';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// 创建DeepSeek provider
const deepseekProvider = createOpenAICompatible({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_KEY || '',
  name: 'deepseek',
});

// 交易工具函数
const tradeTools = {
  buy: async ({ symbol, quantity, price }: { symbol: string; quantity: string; price?: string }) => {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/binance/trade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'buy',
        symbol,
        quantity,
        price,
        orderType: price ? 'LIMIT' : 'MARKET'
      })
    });
    return await response.json();
  },
  
  sell: async ({ symbol, quantity, price }: { symbol: string; quantity: string; price?: string }) => {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/binance/trade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sell',
        symbol,
        quantity,
        price,
        orderType: price ? 'LIMIT' : 'MARKET'
      })
    });
    return await response.json();
  },
  
  setStopLoss: async ({ symbol, stopPrice }: { symbol: string; stopPrice: string }) => {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/binance/trade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'set_stop_loss',
        symbol,
        stopPrice
      })
    });
    return await response.json();
  },
  
  setTakeProfit: async ({ symbol, stopPrice }: { symbol: string; stopPrice: string }) => {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/binance/trade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'set_take_profit',
        symbol,
        stopPrice
      })
    });
    return await response.json();
  }
};

// 获取技术指标数据
async function getTechnicalData(symbol: string = 'BTC') {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/crypto/indicators`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol })
    });

    if (!response.ok) throw new Error('获取技术指标数据失败');
    return await response.json();
  } catch (error) {
    console.error('获取技术指标数据失败:', error);
    throw error;
  }
}

// 解析AI的交易指令
function parseTradeInstructions(text: string) {
  const instructions = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 匹配买入指令（支持限价和市价）
    // 格式：买入 BTC 0.01（市价）
    // 格式：买入 BTC 0.01 价格50000
    const buyMatch = trimmedLine.match(/买入\s*(\w+)\s*(\d+\.?\d*)(?:\s*价格(\d+\.?\d*))?/i);
    if (buyMatch) {
      const instruction: any = {
        action: 'buy',
        symbol: buyMatch[1].toUpperCase() + 'USDT',
        quantity: buyMatch[2]
      };
      if (buyMatch[3]) {
        instruction.price = buyMatch[3];
      }
      instructions.push(instruction);
    }
    
    // 匹配卖出指令（支持限价和市价）
    const sellMatch = trimmedLine.match(/卖出\s*(\w+)\s*(\d+\.?\d*)(?:\s*价格(\d+\.?\d*))?/i);
    if (sellMatch) {
      const instruction: any = {
        action: 'sell',
        symbol: sellMatch[1].toUpperCase() + 'USDT',
        quantity: sellMatch[2]
      };
      if (sellMatch[3]) {
        instruction.price = sellMatch[3];
      }
      instructions.push(instruction);
    }
    
    // 匹配止损指令
    const stopLossMatch = trimmedLine.match(/止损\s*(\w+)\s*(\d+\.?\d*)/i);
    if (stopLossMatch) {
      instructions.push({
        action: 'setStopLoss',
        symbol: stopLossMatch[1].toUpperCase() + 'USDT',
        stopPrice: stopLossMatch[2]
      });
    }
    
    // 匹配止盈指令
    const takeProfitMatch = trimmedLine.match(/止盈\s*(\w+)\s*(\d+\.?\d*)/i);
    if (takeProfitMatch) {
      instructions.push({
        action: 'setTakeProfit',
        symbol: takeProfitMatch[1].toUpperCase() + 'USDT',
        stopPrice: takeProfitMatch[2]
      });
    }
  }
  
  return instructions;
}

export async function POST(request: Request) {
  try {
    // 检查API密钥
    if (!process.env.DEEPSEEK_KEY) {
      return NextResponse.json(
        { error: '未配置DeepSeek API密钥' },
        { status: 500 }
      );
    }

    // 解析请求参数
    const { symbol = 'BTC', autoExecute = false } = await request.json();

    // 获取技术指标数据
    const technicalData = await getTechnicalData(symbol);

    // 获取仓位信息
    const accountResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/binance/account`);
    const accountData = await accountResponse.json();
    const positions = accountData.positions || [];

    // 准备提示词
    const prompt = `你是一个专业的加密货币交易AI，请分析市场数据并给出具体的交易指令。

市场数据：
${JSON.stringify(technicalData, null, 2)}

仓位信息：
${JSON.stringify(positions, null, 2)}

请按照以下步骤进行分析和决策：

1. 市场趋势分析
   - 分析当前价格走势（上涨/下跌/震荡）
   - 关键支撑位和阻力位
   - 技术指标信号（RSI、MACD、均线等）

2. 仓位风险评估
   - 当前持仓盈亏情况
   - 仓位比例是否合理
   - 风险敞口大小

3. 交易决策
   基于以上分析，给出具体的交易指令，格式如下：
   - 买入 BTC 0.01（市价）
   - 卖出 ETH 0.1（限价3500）
   - 止损 BTC 50000
   - 止盈 BTC 55000

4. 风险控制
   - 建议的止损位
   - 建议的止盈位
   - 仓位管理建议

请给出具体的操作建议，并详细说明理由。`;

    // 调用AI生成分析
    const result = await deepseekProvider.chatModel('deepseek-chat').generate({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      maxTokens: 2000,
    });

    const analysisText = result.text;
    
    // 解析交易指令
    const tradeInstructions = parseTradeInstructions(analysisText);
    
    // 执行交易指令（如果启用自动执行）
    const executedTrades = [];
    if (autoExecute && tradeInstructions.length > 0) {
      for (const instruction of tradeInstructions) {
        try {
          const result = await tradeTools[instruction.action](instruction);
          executedTrades.push({
            instruction,
            result
          });
        } catch (error) {
          executedTrades.push({
            instruction,
            error: error.message
          });
        }
      }
    }

    return NextResponse.json({
      analysis: analysisText,
      tradeInstructions,
      executedTrades: autoExecute ? executedTrades : undefined,
      metadata: {
        symbol,
        autoExecute,
        analysisTime: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('智能交易失败:', error);
    return NextResponse.json(
      { error: error.message || '智能交易失败' },
      { status: 500 }
    );
  }
}