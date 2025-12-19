// GET /api/mcp/tools
import { NextResponse } from "next/server";

// 从环境变量读取支持的币种
const COIN_OPTIONS = process.env.COIN_OPTIONS?.split(",") || ["BTC", "ETH", "SOL"];
const TIME_PERIODS = ["1m", "5m", "15m", "1h", "4h", "1d"];
const INDICATOR_TYPES = ["sma", "ema", "rsi", "macd"];

const tools = [
  {
    name: "crypto_indicators",
    description: "计算加密货币技术指标，支持 SMA、EMA、RSI、MACD",
    inputSchema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "加密货币代码",
          enum: COIN_OPTIONS
        },
        timeframe: {
          type: "string",
          description: "时间周期",
          enum: TIME_PERIODS
        },
        indicator: {
          type: "string",
          description: "指标类型",
          enum: INDICATOR_TYPES
        },
        period: {
          type: "integer",
          description: "指标计算周期，仅对 SMA/EMA/RSI 生效，MACD 固定使用 fast=12, slow=26, signal=9",
          minimum: 1,
          maximum: 200,
          default: 14
        },
        limit: {
          type: "integer",
          description: "获取的 K 线数据数量",
          minimum: 50,
          maximum: 1000,
          default: 100
        }
      },
      required: ["symbol", "timeframe", "indicator"]
    },
    examples: [
      {
        name: "calculate_rsi",
        description: "计算 BTC 的 1h RSI 指标",
        arguments: {
          symbol: "BTC",
          timeframe: "1h",
          indicator: "rsi",
          period: 14,
          limit: 100
        }
      },
      {
        name: "calculate_macd",
        description: "计算 ETH 的 4h MACD 指标",
        arguments: {
          symbol: "ETH",
          timeframe: "4h",
          indicator: "macd",
          limit: 200
        }
      }
    ]
  }
]
export async function GET() {
  return NextResponse.json({

    "jsonrpc": "2.0",
    result: {
      tools
    },


  });
}
export async function POST(request: Request) {
  const req = await request.json();
  if (req.method == "tools/call") {
    const res = await fetch(
      "http://154.36.184.107:3000/api/crypto/indicators",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.params.arguments)
      }
    );

    const result = await res.json();
    console.log(result, "result");

    return NextResponse.json({
      result: {
        "content": [
          { "type": "text", "text": JSON.stringify(result.data.indicator) },

        ]
      }
    });
  }

  return NextResponse.json({

    "jsonrpc": "2.0",
    result: {
      tools
    },



  });
}
