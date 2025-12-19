import { NextResponse } from 'next/server';
import Binance from 'binance-api-node';

export async function GET(request: Request) {
 
  try {
    // 从环境变量获取币安API密钥
    const apiKey = process.env.BINANCE_API_KEY;
    const apiSecret = process.env.BINANCE_SECRET_KEY;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: '币安API密钥未配置' },
        { status: 500 }
      );
    }

    // 创建币安API客户端
    const client = Binance({
      apiKey,
      apiSecret,
      useServerTime: true,
    });

    // 获取合约账户信息
    const accountInfo = await client.futuresAccountInfo();

    // 获取持仓情况
    const positions = await client.futuresPositionRisk();

    // 过滤出有持仓的合约
    const activePositions = positions.filter(
      (position: any) => parseFloat(position.positionAmt) !== 0
    );

    // 构造响应数据
    const responseData = {
      // 账户余额信息
      account: {
        totalMarginBalance: accountInfo.totalMarginBalance,
        totalWalletBalance: accountInfo.totalWalletBalance,
        totalUnrealizedProfit: accountInfo.totalUnrealizedProfit,
        availableBalance: accountInfo.availableBalance,
       // positionsNotional: accountInfo.totalPositionNotionalValue,
      },
      // 持仓情况
      positions: activePositions.map((position: any) => ({
        symbol: position.symbol,
        positionAmt: position.positionAmt,
        entryPrice: position.entryPrice,
        markPrice: position.markPrice,
        unrealizedProfit: position.unRealizedProfit,
        liquidationPrice: position.liquidationPrice,
        leverage: position.leverage,
        marginType: position.marginType,
        isolatedMargin: position.isolatedMargin,
      })),
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('获取币安合约账户信息失败:', error);
    return NextResponse.json(
      { error: error.message || '获取币安合约账户信息失败' },
      { status: 500 }
    );
  }
}
