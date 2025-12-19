import { NextResponse } from 'next/server';
import Binance from 'binance-api-node';
import { SMA, EMA, RSI, MACD } from 'technicalindicators';

// 从环境变量获取支持的加密货币列表（例如: BTC,ETH,SOL）
const COIN_OPTIONS = process.env.COIN_OPTIONS?.split(',') || [];

// 支持的时间周期
const TIME_PERIODS = [ '5m', '15m', '1h', '4h', '1d'];

// 支持的指标类型
const INDICATOR_TYPES = ['sma', 'ema', 'rsi', 'macd'];

// 计算单个指标的函数
async function calculateSingleIndicator(closes: number[], indicatorType: string, period: number) {
  let indicatorResult: any = [];
  
  switch (indicatorType) {
    case 'sma':
      indicatorResult = SMA.calculate({ period, values: closes });
      break;
    case 'ema':
      indicatorResult = EMA.calculate({ period, values: closes });
      break;
    case 'rsi':
      indicatorResult = RSI.calculate({ period, values: closes });
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
  
  return indicatorResult;
}

// 获取指定时间框架的数据
async function getDataForTimeframe(client: any, symbol: string, timeframe: string) {
  // 为了确保所有指标都有足够数据计算，我们需要获取更多历史数据
  // MACD需要最多数据（slowPeriod=26），所以获取60条数据确保所有指标都能计算
  const klines = await client.candles({
    symbol: `${symbol}USDT`,
    interval: timeframe as any,
    limit: 60, // 获取60条数据确保所有指标都能正确计算
  });

  if (!klines || klines.length === 0) {
    throw new Error(`获取${timeframe}时间框架的K线数据失败`);
  }

  // 提取数据
  const closes = klines.map((k: any) => parseFloat(k.close));
  const opens = klines.map((k: any) => parseFloat(k.open));
  const volumes = klines.map((k: any) => parseFloat(k.volume));
  const timestamps = klines.map((k: any) => k.openTime);

  // 计算所有指标（使用默认周期14）
  const period = 14;
  const indicators = {
    sma: await calculateSingleIndicator(closes, 'sma', period),
    ema: await calculateSingleIndicator(closes, 'ema', period),
    rsi: await calculateSingleIndicator(closes, 'rsi', period),
    macd: await calculateSingleIndicator(closes, 'macd', period),
  };

  // 确定每个指标的有效数据起始位置
  const smaStartIndex = closes.length - indicators.sma.length;
  const emaStartIndex = closes.length - indicators.ema.length;
  const rsiStartIndex = closes.length - indicators.rsi.length;
  const macdStartIndex = closes.length - indicators.macd.DIF.length;
  
  // 找到所有指标都有有效数据的起始位置
  const validStartIndex = Math.max(smaStartIndex, emaStartIndex, rsiStartIndex, macdStartIndex);
  
  // 确保返回20条有效数据，如果有效数据不足20条，则返回所有有效数据
  const validDataCount = closes.length - validStartIndex;
  const returnCount = Math.min(20, validDataCount);
  const sliceStart = Math.max(validStartIndex, closes.length - returnCount);
  
  // 提取有效数据
  const validTimestamps = timestamps.slice(sliceStart);
  const validOpens = opens.slice(sliceStart);
  const validCloses = closes.slice(sliceStart);
  const validVolumes = volumes.slice(sliceStart);
  
  // 提取有效指标数据
  const validIndicators = {
    sma: indicators.sma.slice(sliceStart - smaStartIndex),
    ema: indicators.ema.slice(sliceStart - emaStartIndex),
    rsi: indicators.rsi.slice(sliceStart - rsiStartIndex),
    macd: {
      DIF: indicators.macd.DIF.slice(sliceStart - macdStartIndex),
      DEA: indicators.macd.DEA.slice(sliceStart - macdStartIndex),
      MACD: indicators.macd.MACD.slice(sliceStart - macdStartIndex),
    },
  };

  return {
    timestamps: validTimestamps,
    opens: validOpens,
    closes: validCloses,
    volumes: validVolumes,
    indicators: validIndicators,
    metadata: {
      fetchedCandles: klines.length,
      returnedCandles: returnCount,
      validStartIndex: validStartIndex,
      updateTime: new Date().toISOString(),
      note: `获取60条数据用于计算，返回${returnCount}条有效数据。所有指标都有值且可靠。`
    }
  };
}

export async function POST(request: Request) {
  try {
    const { symbol } = await request.json();

    // 参数验证
    if (!symbol) {
      return NextResponse.json({ error: '必须指定加密货币代码 (symbol)' }, { status: 400 });
    }
    
    const upperSymbol = symbol.toUpperCase();
    if (!COIN_OPTIONS.includes(upperSymbol)) {
      return NextResponse.json(
        { error: `不支持的加密货币，支持的有: ${COIN_OPTIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Binance 客户端（公共接口无需密钥）
    const client = Binance();

    // 获取所有时间框架的数据
    const allData: any = {};
    
    for (const timeframe of TIME_PERIODS) {
      try {
        allData[timeframe] = await getDataForTimeframe(client, upperSymbol, timeframe);
      } catch (error) {
        console.error(`获取${timeframe}时间框架数据失败:`, error);
        allData[timeframe] = { error: `获取${timeframe}时间框架数据失败` };
      }
    }

    // 响应数据
    const responseData = {
      symbol: upperSymbol,
      data: allData,
      metadata: {
        updateTime: new Date().toISOString(),
        note: '返回所有时间框架的SMA、EMA、RSI、MACD指标和交易量数据。所有返回的数据都有值且可靠，最多返回20条有效数据。'
      }
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('获取指标数据失败:', error);
    return NextResponse.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    );
  }
}