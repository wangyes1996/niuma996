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
  instructions: '你是一个专业的加密货币交易分析师，擅长技术指标分析和市场趋势判断。请用中文回答，保持专业、客观。',
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

// 使用Mastra生成分析
export async function generateAnalysisWithMastra(symbol: string, technicalData: any) {
  try {
    // 准备提示词
    const prompt = `请分析${symbol}的市场行情，基于以下技术指标：

${JSON.stringify(technicalData, null, 2)}

请提供：
1. 当前趋势分析
2. 关键支撑位和阻力位
3. 技术指标解读
4. 交易建议

请用中文回答，保持专业、客观。`;

    // 使用Agent生成分析
    const result = await analysisAgent.generate(prompt, {
      temperature: 0.7,
      maxTokens: 2000,
    });
    
    // console.log('Agent.generate result:', result);
    
    // 检查返回结果结构
    if (result.text) {
      return result.text;
    } else if (result.output) {
      return result.output;
    } else {
      return JSON.stringify(result);
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
    const { symbol = 'BTC' } = await request.json();

    // 获取技术指标数据
    const technicalData = await getTechnicalData(symbol);

    // 使用Mastra生成分析
    const analysis = await generateAnalysisWithMastra(symbol, technicalData);
    console.log(analysis, "analysis");
    return NextResponse.json({
      analysis,
      technicalData: {
        symbol: technicalData.symbol,
        timeframes: Object.keys(technicalData.data),
        updateTime: new Date().toISOString(),
      },
      metadata: {
        model: 'deepseek-chat',
        analysisTime: new Date().toISOString(),
        framework: 'mastra'
      }
    });

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

