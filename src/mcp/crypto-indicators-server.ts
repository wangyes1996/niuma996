import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from '@modelcontextprotocol/sdk/types.js';
import Binance from 'binance-api-node';
import { SMA, EMA, RSI, MACD } from 'technicalindicators';
import { formatToBeijing } from '../lib/time';

// 支持的加密货币列表
const COIN_OPTIONS = process.env.COIN_OPTIONS?.split(',') || ['BTC', 'ETH', 'SOL'];

// 支持的时间周期
const TIME_PERIODS = ['1m', '5m', '15m', '1h', '4h', '1d'];

// 支持的指标类型
const INDICATOR_TYPES = ['sma', 'ema', 'rsi', 'macd'];

// 工具定义
const CALCULATE_INDICATOR_TOOL: ToolSchema = {
  name: 'calculate_indicator',
  description: '计算加密货币技术指标',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: {
        type: 'string',
        description: '加密货币代码 (如: BTC, ETH, SOL)',
        enum: COIN_OPTIONS,
      },
      timeframe: {
        type: 'string',
        description: '时间周期',
        enum: TIME_PERIODS,
      },
      indicator: {
        type: 'string',
        description: '指标类型',
        enum: INDICATOR_TYPES,
      },
      period: {
        type: 'number',
        description: '指标周期 (默认: 14)',
        default: 14,
        minimum: 1,
        maximum: 200,
      },
      limit: {
        type: 'number',
        description: '数据数量 (默认: 100)',
        default: 100,
        minimum: 50,
        maximum: 1000,
      },
    },
    required: ['symbol', 'timeframe', 'indicator'],
  },
};

// 计算技术指标
async function calculateIndicator(params: {
  symbol: string;
  timeframe: string;
  indicator: string;
  period?: number;
  limit?: number;
}) {
  const { symbol, timeframe, indicator, period = 14, limit = 100 } = params;

  try {
    // 参数验证
    if (!COIN_OPTIONS.includes(symbol)) {
      throw new Error(`不支持的加密货币，支持的有: ${COIN_OPTIONS.join(', ')}`);
    }

    if (!TIME_PERIODS.includes(timeframe)) {
      throw new Error(`不支持的时间周期，支持的有: ${TIME_PERIODS.join(', ')}`);
    }

    if (!INDICATOR_TYPES.includes(indicator)) {
      throw new Error(`不支持的指标类型，支持的有: ${INDICATOR_TYPES.join(', ')}`);
    }

    if (period < 1 || period > 200) {
      throw new Error('周期参数必须在1-200之间');
    }

    if (limit < 50 || limit > 1000) {
      throw new Error('数据数量必须在50-1000之间');
    }

    // Binance 客户端
    const client = Binance();

    // 获取K线数据
    const klines = await client.candles({
      symbol: `${symbol}USDT`,
      interval: timeframe as any,
      limit: limit,
    });

    if (!klines || klines.length === 0) {
      throw new Error('获取K线数据失败');
    }

    // 提取数据
    const closes = klines.map((k: any) => parseFloat(k.close));
    const opens = klines.map((k: any) => parseFloat(k.open));
    const volumes = klines.map((k: any) => parseFloat(k.volume));

    // 计算指标
    let indicatorResult: any;

    switch (indicator) {
      case 'sma':
        indicatorResult = SMA.calculate({ period: period, values: closes });
        break;

      case 'ema':
        indicatorResult = EMA.calculate({ period: period, values: closes });
        break;

      case 'rsi':
        indicatorResult = RSI.calculate({ period: period, values: closes });
        break;

      case 'macd':
        const macdOutput = MACD.calculate({
          values: closes,
          fastPeriod: 12,
          slowPeriod: 26,
          signalPeriod: 9,
          SimpleMA: false,
        });
        indicatorResult = {
          DIF: macdOutput.map((item: any) => item.MACD),
          DEA: macdOutput.map((item: any) => item.signal),
          MACD: macdOutput.map((item: any) => item.histogram),
        };
        break;
    }

    // 对齐数据
    let alignedIndicator: any;
    if (indicator === 'macd') {
      const offset = closes.length - indicatorResult.DIF.length;
      alignedIndicator = {
        DIF: Array(offset).fill(null).concat(indicatorResult.DIF),
        DEA: Array(offset).fill(null).concat(indicatorResult.DEA),
        MACD: Array(offset).fill(null).concat(indicatorResult.MACD),
      };
    } else {
      const offset = closes.length - indicatorResult.length;
      alignedIndicator = Array(offset).fill(null).concat(indicatorResult);
    }

    return {
      symbol,
      timeframe,
      indicator,
      period: indicator === 'macd' ? { fast: 12, slow: 26, signal: 9 } : period,
      data: {
        timestamps: klines.map((k: any) => k.openTime),
        opens,
        closes,
        volumes,
        indicator: alignedIndicator,
      },
      metadata: {
        fetchedCandles: klines.length,
        effectiveValues: indicator === 'macd' 
          ? indicatorResult.DIF.length 
          : indicatorResult.length,
        updateTime: new Date().toISOString(),
        updateTimeBeijing: formatToBeijing(new Date()),
        note: '使用 technicalindicators 库计算，指标前部为 null 表示计算所需历史数据不足',
      },
    };
  } catch (error: any) {
    throw new Error(`计算指标失败: ${error.message}`);
  }
}

// 创建 MCP 服务器
class CryptoIndicatorsServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'crypto-indicators',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // 处理工具列表请求
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [CALCULATE_INDICATOR_TOOL],
      };
    });

    // 处理工具调用请求
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'calculate_indicator':
            const result = await calculateIndicator(args as any);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Crypto Indicators MCP server running on stdio');
  }
}

// 主函数
async function main() {
  const server = new CryptoIndicatorsServer();
  await server.run();
}

// 如果直接运行此文件，启动服务器
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error in main():', error);
    process.exit(1);
  });
}

// 导出服务器类供测试使用
export { CryptoIndicatorsServer };