import { NextResponse } from 'next/server';
import { Mastra } from '@mastra/core/mastra';
import { Agent } from '@mastra/core/agent';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { MastraModelGateway, type ProviderConfig } from '@mastra/core/llm';
import type { LanguageModelV2 } from '@ai-sdk/provider';

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

// 创建分析Agent
const analysisAgent = new Agent({
  name: 'crypto-analyst',
  instructions: `你是一个专业的加密货币交易分析师，擅长技术指标分析和市场趋势判断。

请根据市场数据，提供专业的分析报告，包括：
1. 当前趋势分析
2. 关键支撑位和阻力位
3. 技术指标解读
4. 交易建议

请用中文回答，保持专业、客观。`,
  model: deepseekProvider.chatModel('deepseek-chat'),
});

// 优化的数据获取函数 - 并行处理
async function getOptimizedData(symbol: string) {
  try {
    // 并行获取技术指标数据和账户数据
    const [technicalResponse, accountResponse] = await Promise.all([
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/crypto/indicators-optimized`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      }),
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/binance/account`)
    ]);

    if (!technicalResponse.ok) {
      throw new Error('获取技术指标数据失败');
    }

    const technicalData = await technicalResponse.json();
    const accountData = accountResponse.ok ? await accountResponse.json() : { positions: [] };

    return {
      technicalData,
      positions: accountData.positions || []
    };
  } catch (error) {
    console.error('获取数据失败:', error);
    throw error;
  }
}

// 优化的分析生成函数
export async function generateOptimizedAnalysis(symbol: string, data: any) {
  try {
    const { technicalData, positions } = data;

    // 简化提示词，只包含关键信息
    const keyData = {
      symbol: technicalData.symbol,
      timeframes: Object.keys(technicalData.data).slice(0, 3), // 只取前3个时间框架
      latestData: {}
    };

    // 提取每个时间框架的最新数据
    for (const timeframe of keyData.timeframes) {
      const tfData = technicalData.data[timeframe];
      if (tfData && tfData.closes && tfData.closes.length > 0) {
        const lastIndex = tfData.closes.length - 1;
        keyData.latestData[timeframe] = {
          close: tfData.closes[lastIndex],
          volume: tfData.volumes[lastIndex],
          rsi: tfData.indicators?.rsi?.[lastIndex],
          sma: tfData.indicators?.sma?.[lastIndex],
          ema: tfData.indicators?.ema?.[lastIndex],
        };
      }
    }

    // 构建简洁的提示词
    let prompt = `请分析${symbol}的短期市场行情，基于以下关键数据：

${JSON.stringify(keyData, null, 2)}

请提供：
1. 当前趋势（1-2句话）
2. 关键价位（支撑位/阻力位）
3. 简单交易建议

保持回答简洁专业，不超过200字。`;

    // 如果有仓位信息，简要添加
    if (positions && positions.length > 0) {
      const relevantPositions = positions.filter((p: any) => 
        p.symbol.includes(symbol) && Math.abs(parseFloat(p.positionAmt)) > 0
      );
      
      if (relevantPositions.length > 0) {
        prompt += `

当前持仓：${relevantPositions.length}个相关仓位
建议：请结合持仓情况给出操作意见`;
      }
    }

    // 使用Agent生成分析
    const result = await analysisAgent.generate(prompt, {
      temperature: 0.3, // 降低温度以提高响应速度
      maxTokens: 500,   // 减少token数量
    });
    
    return result.text || result.output || JSON.stringify(result);
  } catch (error) {
    console.error('AI分析失败:', error);
    throw error;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTC';

    // 创建ReadableStream来发送数据
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 发送开始信号
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: '正在获取市场数据...' })}\n`));
          
          // 并行获取数据（优化版）
          const data = await getOptimizedData(symbol);
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: '正在生成AI分析...' })}
\n`));
          
          // 生成优化版分析
          const analysis = await generateOptimizedAnalysis(symbol, data);
          
          // 发送分析结果
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: analysis })}
\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}
\n`));
          
          controller.close();
        } catch (error) {
          console.error('AI分析失败:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: error instanceof Error ? error.message : 'AI分析失败' })}
\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI分析失败' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';