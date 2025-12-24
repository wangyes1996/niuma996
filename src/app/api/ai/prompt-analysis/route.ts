import { NextResponse } from 'next/server';
import { getAnalysisPrompt, getTradingPrompt, getPromptByType } from '@/lib/prompts';

/**
 * AI分析接口 - 使用提示词文件进行AI分析
 * 支持不同类型的分析：analysis, trading, default
 */

export async function POST(request: Request) {
  try {
    const { symbol, promptType = 'analysis', marketData, indicators } = await request.json();

    // 参数验证
    if (!symbol) {
      return NextResponse.json({ error: '必须指定加密货币代码 (symbol)' }, { status: 400 });
    }

    if (!marketData || !indicators) {
      return NextResponse.json({ error: '必须提供市场数据和技术指标' }, { status: 400 });
    }

    // 获取对应的提示词
    const prompt = getPromptByType(promptType);
    
    if (!prompt) {
      return NextResponse.json({ error: '无法获取对应的提示词' }, { status: 500 });
    }

    // 构建AI分析请求
    const analysisRequest = {
      prompt,
      context: {
        symbol,
        marketData,
        indicators,
        timestamp: new Date().toISOString(),
      },
      // 这里可以集成你的AI服务，比如 OpenAI、DeepSeek 等
      // 示例：
      // aiService: 'deepseek',
      // apiKey: process.env.DEEPSEEK_KEY,
    };

    // 模拟AI分析结果（实际使用时替换为真实的AI服务调用）
    const mockAnalysis = {
      signal: 'HOLD',
      confidence: 0.75,
      reason: `基于${symbol}当前的技术指标分析，市场处于震荡状态，建议观望。`,
      risk_level: 'MEDIUM',
      key_levels: {
        support: marketData.low * 0.98,
        resistance: marketData.high * 1.02,
      },
      indicators_summary: {
        rsi: indicators.rsi[indicators.rsi.length - 1],
        ema: indicators.ema[indicators.ema.length - 1],
        macd: indicators.macd?.MACD[indicators.macd.MACD.length - 1],
      },
      recommendation: {
        action: '等待更明确的信号',
        timeframe: '1h',
        risk_reward_ratio: '1:2',
      }
    };

    // 实际AI服务集成示例（取消注释并配置）
    /*
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: prompt
          },
          {
            role: 'user',
            content: `请分析以下数据：${JSON.stringify(analysisRequest.context)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const aiResult = await response.json();
    */

    const responseData = {
      success: true,
      symbol,
      promptType,
      analysis: mockAnalysis,
      metadata: {
        promptUsed: promptType,
        timestamp: new Date().toISOString(),
        note: '当前为模拟分析结果，实际使用时请集成真实的AI服务'
      }
    };

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('AI分析失败:', error);
    return NextResponse.json(
      { error: error.message || 'AI分析服务内部错误' },
      { status: 500 }
    );
  }
}

/**
 * 获取可用的提示词类型和文件列表
 */
export async function GET() {
  try {
    const promptsDir = process.env.PROMPTS_DIR || './prompts';
    const defaultPromptFile = process.env.DEFAULT_PROMPT_FILE || 'prompt.txt';
    const analysisPromptFile = process.env.AI_ANALYSIS_PROMPT_FILE || 'analysis_prompt.txt';
    const tradingPromptFile = process.env.AI_TRADING_PROMPT_FILE || 'trading_prompt.txt';

    const availableTypes = [
      {
        type: 'default',
        file: defaultPromptFile,
        description: '默认通用提示词'
      },
      {
        type: 'analysis',
        file: analysisPromptFile,
        description: '技术分析专用提示词'
      },
      {
        type: 'trading',
        file: tradingPromptFile,
        description: '交易决策专用提示词'
      }
    ];

    return NextResponse.json({
      success: true,
      availableTypes,
      promptsDir,
      note: '使用 POST 方法并指定 promptType 参数来使用不同的提示词'
    });

  } catch (error: any) {
    console.error('获取提示词信息失败:', error);
    return NextResponse.json(
      { error: error.message || '获取提示词信息失败' },
      { status: 500 }
    );
  }
}