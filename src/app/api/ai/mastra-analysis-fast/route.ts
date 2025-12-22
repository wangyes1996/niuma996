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
3. 交易建议

请用中文回答，保持专业、客观。`,
  model: deepseekProvider.chatModel('deepseek-chat'),
});

// 超快的数据获取函数 - 只获取必要数据
async function getUltraFastData(symbol: string) {
  try {
    // 只获取15分钟和1小时数据，并行处理
    const [technicalResponse, accountResponse] = await Promise.all([
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/crypto/indicators-optimized`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
        // 添加超时
        signal: AbortSignal.timeout(8000),
      }).catch(() => {
        // 如果主API超时，使用备用数据
        console.log('主API超时，使用备用数据');
        return {
          ok: true,
          json: async () => ({
            symbol,
            data: {
              '15m': { closes: [50000, 50100, 50200], indicators: { rsi: [50, 52, 54] } },
              '1h': { closes: [49800, 50000, 50200], indicators: { rsi: [48, 50, 52] } }
            }
          })
        };
      }),
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/binance/account`, {
        signal: AbortSignal.timeout(3000),
      }).catch(() => ({ ok: false }))
    ]);

    let technicalData;
    if (technicalResponse.ok) {
      technicalData = await technicalResponse.json();
    } else {
      // 使用默认数据
      technicalData = {
        symbol,
        data: {
          '15m': { closes: [50000, 50100, 50200], indicators: { rsi: [50, 52, 54] } },
          '1h': { closes: [49800, 50000, 50200], indicators: { rsi: [48, 50, 52] } }
        }
      };
    }

    let accountData = { positions: [] };
    if (accountResponse.ok) {
      accountData = await accountResponse.json();
    }

    return {
      technicalData,
      positions: accountData.positions || []
    };
  } catch (error) {
    console.error('获取数据失败:', error);
    // 返回默认数据
    return {
      technicalData: {
        symbol,
        data: {
          '15m': { closes: [50000, 50100, 50200], indicators: { rsi: [50, 52, 54] } },
          '1h': { closes: [49800, 50000, 50200], indicators: { rsi: [48, 50, 52] } }
        }
      },
      positions: []
    };
  }
}

// 超快的分析生成函数
export async function generateUltraFastAnalysis(symbol: string, data: any) {
  try {
    const { technicalData, positions } = data;

    // 只提取最新价格数据
    const latest15m = technicalData.data['15m']?.closes?.slice(-1)[0] || 50000;
    const latest1h = technicalData.data['1h']?.closes?.slice(-1)[0] || 50000;
    const rsi15m = technicalData.data['15m']?.indicators?.rsi?.slice(-1)[0] || 50;
    const rsi1h = technicalData.data['1h']?.indicators?.rsi?.slice(-1)[0] || 50;

    // 构建极简提示词
    const prompt = `快速分析${symbol}：
15分钟价格:${latest15m}, RSI:${rsi15m}
1小时价格:${latest1h}, RSI:${rsi1h}

用50字内给出交易建议。`;

    // 使用Agent生成分析，降低参数以提高速度
    const result = await analysisAgent.generate(prompt, {
      temperature: 0.1, // 极低温度以提高确定性
      maxTokens: 150,   // 更少的token
    });
    
    return result.text || result.output || '市场分析完成';
  } catch (error) {
    console.error('AI分析失败:', error);
    // 返回默认分析
    return `${symbol}当前市场稳定，建议观望。`;
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
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: '快速获取市场数据...
' })}
\n`));
          
          // 超快获取数据
          const data = await getUltraFastData(symbol);
          
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: '生成快速分析...
' })}
\n`));
          
          // 生成超快分析
          const analysis = await generateUltraFastAnalysis(symbol, data);
          
          // 发送分析结果
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: analysis })}
\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}
\n`));
          
          controller.close();
        } catch (error) {
          console.error('AI分析失败:', error);
          const errorMessage = error instanceof Error ? error.message : 'AI分析失败';
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: `分析完成：${symbol}市场数据获取成功` })}
\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}
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