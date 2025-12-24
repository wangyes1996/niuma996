import { NextResponse } from 'next/server';
import { formatToBeijing } from '@/lib/time';
import { Mastra } from '@mastra/core/mastra';
import { Agent } from '@mastra/core/agent';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { MastraModelGateway, type ProviderConfig } from '@mastra/core/llm';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import { readPromptFile } from '@/lib/prompts';

// 创建自定义DeepSeek网关
class DeepSeekGateway extends MastraModelGateway {
  readonly id = 'deepseek';
  readonly name = 'DeepSeek Gateway';

  async fetchProviders(): Promise<Record<string, ProviderConfig>> {
    return {
      'deepseek': {
        name: 'DeepSeek',
        models: ['deepseek-chat', 'deepseek-code', 'deepseek-v3.1'],
        apiKeyEnvVar: 'DEEPSEEK_KEY',
        gateway: this.id,
      },
    };
  }

  buildUrl(modelId: string): string {
    return 'https://api.deepseek.com/v1';
  }

  async getApiKey(modelId: string): Promise<string> {
    const apiKey = process.env.DEEPSEEK_KEY;
    if (!apiKey) throw new Error('DEEPSEEK_KEY not set');
    return apiKey;
  }

  async resolveLanguageModel({
    modelId,
    providerId,
    apiKey,
  }: {
    modelId: string;
    providerId: string;
    apiKey: string;
  }): Promise<LanguageModelV2> {
    const baseURL = this.buildUrl(modelId);
    return createOpenAICompatible({
      name: providerId,
      apiKey,
      baseURL,
    }).chatModel(modelId);
  }
}

// 创建OpenAI兼容的DeepSeek provider
const deepseekProvider = createOpenAICompatible({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_KEY || '',
  name: 'deepseek',
});

// 创建Mastra实例
const mastra = new Mastra();

// 创建分析Agent（基础角色定义）
const analysisAgent = new Agent({
  name: 'crypto-analyst',
  instructions: '你是一个专业的加密货币交易分析师，擅长技术指标分析和市场趋势判断。',
  model: deepseekProvider.chatModel('deepseek-chat'),
});

// 获取技术指标数据
export async function getTechnicalData(symbol: string = 'BTC') {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/crypto/indicators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbol }),
    });

    if (!response.ok) {
      throw new Error('获取技术指标数据失败');
    }

    return await response.json();
  } catch (error) {
    console.error('获取技术指标数据失败:', error);
    throw error;
  }
}

// 执行AI交易决策
async function executeAIDecision(symbol: string, decision: any) {
  try {
    const tradeData = {
      action: decision.action,
      symbol: `${symbol}USDT`,
      quantity: decision.quantity,
      price: decision.price,
      orderType: decision.orderType || 'MARKET',
      positionSide: 'BOTH'
    };

    console.log('执行AI交易决策:', tradeData);

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const tradeUrl = `${baseUrl}/api/binance/trade-enhanced`;
    
    console.log('Sending trade request to:', tradeUrl);
    
    const response = await fetch(tradeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tradeData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Trade API error:', response.status, errorText);
      throw new Error(`交易执行失败: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    if (result.success) {
      // 设置止损和止盈
      if (decision.stopLoss || decision.takeProfit) {
        await setRiskManagement(symbol, decision);
      }
      
      console.log('AI交易执行成功:', result);
      return {
        success: true,
        orderId: result.data?.orderId,
        executedPrice: result.data?.avgPrice || decision.price,
        timestamp: new Date().toISOString(),
        timestampBeijing: formatToBeijing(new Date())
      };
    } else {
      console.error('AI交易执行失败:', result.error);
      return {
        success: false,
        error: result.error,
        timestamp: new Date().toISOString(),
        timestampBeijing: formatToBeijing(new Date())
      };
    }
  } catch (error) {
    console.error('执行AI交易决策异常:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      timestampBeijing: formatToBeijing(new Date())
    };
  }
}

// 设置风险管理（止损/止盈）
async function setRiskManagement(symbol: string, decision: any) {
  try {
    const riskOrders = [];
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // 设置止损
    if (decision.stopLoss) {
      riskOrders.push(
        fetch(`${baseUrl}/api/binance/trade-enhanced`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'set_stop_loss',
            symbol: `${symbol}USDT`,
            stopPrice: decision.stopLoss
          }),
        }).then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Stop loss API error:', response.status, errorText);
            throw new Error(`设置止损失败: ${response.status} ${errorText}`);
          }
          return response.json();
        })
      );
    }

    // 设置止盈
    if (decision.takeProfit) {
      riskOrders.push(
        fetch(`${baseUrl}/api/binance/trade-enhanced`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'set_take_profit',
            symbol: `${symbol}USDT`,
            stopPrice: decision.takeProfit
          }),
        }).then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Take profit API error:', response.status, errorText);
            throw new Error(`设置止盈失败: ${response.status} ${errorText}`);
          }
          return response.json();
        })
      );
    }

    const results = await Promise.allSettled(riskOrders);
    console.log('风险管理设置完成:', results);
    
    return results;
  } catch (error) {
    console.error('设置风险管理失败:', error);
    return [];
  }
}

// 生成分析（支持自动交易）
export async function generateAnalysis(
  symbol: string, 
  technicalData: any, 
  enableAutoTrading: boolean = false
) {
  try {
    // 获取账户信息
    const accountResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/binance/account`);
    const accountData = await accountResponse.json();
    const positions = accountData.positions || [];

    // 根据模式选择提示词文件
    const promptFile = enableAutoTrading 
      ? (process.env.MASTRA_AUTO_PROMPT_FILE || 'trading_prompt.txt')
      : 'analysis_prompt.txt';
    
    let basePrompt = readPromptFile(promptFile);
    
    // 如果没有找到对应的提示词文件，使用默认提示词
    if (!basePrompt) {
      basePrompt = enableAutoTrading
        ? `你是一个专业的加密货币交易AI，请分析${symbol}的市场行情并直接给出交易决策。`
        : `你是一个专业的加密货币交易分析师，请分析${symbol}的市场行情并提供专业建议。`;
    }

    // 构建完整的提示词
    let prompt = `${basePrompt}

市场数据：
${JSON.stringify(technicalData, null, 2)}`;

    // 如果有仓位信息，添加到提示词
    if (positions && positions.length > 0) {
      const currentPosition = positions.find((p: any) => p.symbol === `${symbol}USDT` && parseFloat(p.positionAmt) !== 0);
      if (currentPosition) {
        prompt += `

当前持仓信息：
${JSON.stringify(currentPosition, null, 2)}`;
      }
    }

    // 根据模式添加具体要求
    if (enableAutoTrading) {
      prompt += `

当前要求（自动交易模式）：
1. 基于技术指标分析市场趋势
2. 评估当前持仓风险  
3. 直接给出具体的交易操作（买入/卖出/平仓/加仓/减仓）
4. 给出操作的数量和价格建议
5. 设置止损和止盈位

请严格按照以下JSON格式返回决策结果：
{
  "action": "buy|sell|close|add|reduce|hold",
  "quantity": 0.001,
  "price": 50000,
  "orderType": "MARKET|LIMIT",
  "stopLoss": 49000,
  "takeProfit": 51000,
  "reason": "分析原因",
  "confidence": 0.8
}

重要规则：
- 只有在高置信度时才建议交易
- 必须设置止损保护
- 保持风险控制`;
    } else {
      prompt += `

当前要求（分析模式）：
1. 当前趋势分析
2. 关键支撑位和阻力位
3. 技术指标解读
4. 交易建议
5. 风险控制建议

请用中文回答，保持专业、客观。`;
    }

    // 使用Agent生成分析
    const result = await analysisAgent.generate(prompt, {
      temperature: enableAutoTrading ? 0.3 : 0.7, // 自动交易用更低温度提高准确性
      maxTokens: enableAutoTrading ? 1000 : 2000,
    });
    
    const aiResponse = result.text || result.output || JSON.stringify(result);

    // 如果启用了自动交易，解析决策并执行
    if (enableAutoTrading) {
      let aiDecision;
      try {
        // 尝试从AI响应中提取JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiDecision = JSON.parse(jsonMatch[0]);
        } else {
          return {
            analysis: aiResponse,
            decision: null,
            autoTrade: false,
            error: '无法解析AI决策JSON'
          };
        }
      } catch (parseError) {
        console.error('解析AI决策失败:', parseError);
        return {
          analysis: aiResponse,
          decision: null,
          autoTrade: false,
          error: '解析AI决策失败'
        };
      }

      // 执行自动交易决策
      let tradeResult = null;
      if (aiDecision && aiDecision.action !== 'hold' && aiDecision.confidence > 0.7) {
        try {
          tradeResult = await executeAIDecision(symbol, aiDecision);
        } catch (tradeError) {
          console.error('执行AI交易决策失败:', tradeError);
        }
      }

      return {
        analysis: aiResponse,
        decision: aiDecision,
        autoTrade: tradeResult,
        timestamp: new Date().toISOString(),
        timestampBeijing: formatToBeijing(new Date())
      };
    } else {
      // 分析模式，直接返回分析结果
      return {
        analysis: aiResponse,
        decision: null,
        autoTrade: null,
        timestamp: new Date().toISOString(),
        timestampBeijing: formatToBeijing(new Date())
      };
    }
  } catch (error) {
    console.error('Mastra分析失败:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    // 检查API密钥
    if (!process.env.DEEPSEEK_KEY) {
      return NextResponse.json(
        { error: '未配置DeepSeek API密钥，请在环境变量中设置DEEPSEEK_KEY' },
        { status: 500 }
      );
    }

    // 解析请求参数
    const { 
      symbol = 'BTC', 
      enableAutoTrading = false,  // 是否启用自动交易
      confidenceThreshold = 0.7   // 置信度阈值
    } = await request.json();

    // 获取技术指标数据
    const technicalData = await getTechnicalData(symbol);

    // 生成分析（根据参数决定是否启用自动交易）
    const analysisResult = await generateAnalysis(symbol, technicalData, enableAutoTrading);
    console.log('AI分析结果:', analysisResult);
    
    // 构建响应数据
    const responseData = {
      success: true,
      symbol,
      mode: enableAutoTrading ? 'auto_trading' : 'analysis_only',
      analysis: analysisResult.analysis,
      technicalData: {
        symbol: technicalData.symbol,
        timeframes: Object.keys(technicalData.data),
        updateTime: new Date().toISOString(),
        updateTimeBeijing: formatToBeijing(new Date())
      },
      metadata: {
        model: 'deepseek-chat',
        analysisTime: new Date().toISOString(),
        analysisTimeBeijing: formatToBeijing(new Date()),
        framework: 'mastra',
        enableAutoTrading,
        confidenceThreshold
      }
    };

    // 如果启用了自动交易，添加交易决策信息
    if (enableAutoTrading) {
      responseData.decision = analysisResult.decision;
      responseData.autoTrade = analysisResult.autoTrade;
      responseData.confidence = analysisResult.decision?.confidence;
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('AI分析失败:', error);

    if (error.message?.includes('401')) {
      return NextResponse.json(
        { error: 'DeepSeek API密钥无效，请检查DEEPSEEK_KEY配置' },
        { status: 401 }
      );
    }

    if (error.message?.includes('rate limit')) {
      return NextResponse.json(
        { error: 'API调用频率限制，请稍后重试' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'AI分析失败' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';