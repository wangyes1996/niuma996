import { NextResponse } from 'next/server';
import Binance from 'binance-api-node';

export async function POST(request: Request) {
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

    // 解析请求参数
    const body = await request.json();
    const {
      action, // 操作类型: buy, sell, set_stop_loss, set_take_profit, move_stop_loss, move_take_profit
      symbol, // 交易对: BTCUSDT, ETHUSDT等
      quantity, // 数量
      price, // 价格（限价单使用）
      stopPrice, // 止损/止盈价格
      orderType = 'MARKET', // 订单类型: MARKET, LIMIT
      leverage, // 杠杆倍数
      positionSide = 'BOTH', // 持仓方向: LONG, SHORT, BOTH
      reduceOnly = false // 是否只减仓
    } = body;

    // 参数验证
    if (!action || !symbol) {
      return NextResponse.json(
        { error: '缺少必要参数: action和symbol' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'buy':
      case 'sell':
        // 开仓/平仓操作
        const side = action.toUpperCase();
        
        if (orderType === 'MARKET') {
          // 市价单
          result = await client.futuresMarketOrder({
            symbol,
            side,
            quantity: parseFloat(quantity),
            positionSide,
            reduceOnly
          });
        } else if (orderType === 'LIMIT') {
          // 限价单
          if (!price) {
            return NextResponse.json(
              { error: '限价单需要提供price参数' },
              { status: 400 }
            );
          }
          result = await client.futuresLimitOrder({
            symbol,
            side,
            quantity: parseFloat(quantity),
            price: parseFloat(price),
            positionSide,
            reduceOnly,
            timeInForce: 'GTC'
          });
        }
        break;

      case 'set_stop_loss':
      case 'set_take_profit':
        // 设置止损/止盈
        if (!stopPrice) {
          return NextResponse.json(
            { error: '止损/止盈需要提供stopPrice参数' },
            { status: 400 }
          );
        }
        
        const stopOrderType = action === 'set_stop_loss' ? 'STOP_MARKET' : 'TAKE_PROFIT_MARKET';
        
        // 先获取当前持仓
        const positions = await client.futuresPositionRisk();
        const currentPosition = positions.find((p: any) => p.symbol === symbol && parseFloat(p.positionAmt) !== 0);
        
        if (!currentPosition) {
          return NextResponse.json(
            { error: '未找到该交易对的持仓' },
            { status: 400 }
          );
        }

        const positionSideForStop = parseFloat(currentPosition.positionAmt) > 0 ? 'LONG' : 'SHORT';
        const stopSide = parseFloat(currentPosition.positionAmt) > 0 ? 'SELL' : 'BUY';

        result = await client.futuresOrder({
          symbol,
          side: stopSide,
          type: stopOrderType,
          stopPrice: parseFloat(stopPrice),
          closePosition: true,
          positionSide: positionSideForStop
        });
        break;

      case 'move_stop_loss':
      case 'move_take_profit':
        // 移动止损/止盈
        if (!stopPrice) {
          return NextResponse.json(
            { error: '移动止损/止盈需要提供新的stopPrice参数' },
            { status: 400 }
          );
        }

        // 先取消原有的止损/止盈订单
        const openOrders = await client.futuresOpenOrders({ symbol });
        const stopOrders = openOrders.filter((order: any) => 
          order.type === 'STOP_MARKET' || order.type === 'TAKE_PROFIT_MARKET'
        );

        for (const order of stopOrders) {
          await client.futuresCancelOrder({
            symbol,
            orderId: order.orderId
          });
        }

        // 设置新的止损/止盈
        const positionsForMove = await client.futuresPositionRisk();
        const currentPositionForMove = positionsForMove.find((p: any) => p.symbol === symbol && parseFloat(p.positionAmt) !== 0);
        
        if (!currentPositionForMove) {
          return NextResponse.json(
            { error: '未找到该交易对的持仓' },
            { status: 400 }
          );
        }

        const positionSideForMove = parseFloat(currentPositionForMove.positionAmt) > 0 ? 'LONG' : 'SHORT';
        const moveSide = parseFloat(currentPositionForMove.positionAmt) > 0 ? 'SELL' : 'BUY';
        const moveOrderType = action === 'move_stop_loss' ? 'STOP_MARKET' : 'TAKE_PROFIT_MARKET';

        result = await client.futuresOrder({
          symbol,
          side: moveSide,
          type: moveOrderType,
          stopPrice: parseFloat(stopPrice),
          closePosition: true,
          positionSide: positionSideForMove
        });
        break;

      case 'set_leverage':
        // 设置杠杆
        if (!leverage) {
          return NextResponse.json(
            { error: '设置杠杆需要提供leverage参数' },
            { status: 400 }
          );
        }
        result = await client.futuresLeverage({
          symbol,
          leverage: parseInt(leverage)
        });
        break;

      default:
        return NextResponse.json(
          { error: '不支持的操作类型' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: '操作成功'
    });

  } catch (error: any) {
    console.error('币安交易操作失败:', error);
    
    // 处理币安API错误
    let errorMessage = '操作失败';
    if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

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

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');

    if (symbol) {
      // 获取特定交易对的持仓信息
      const position = await client.futuresPositionRisk({ symbol });
      const openOrders = await client.futuresOpenOrders({ symbol });
      
      return NextResponse.json({
        symbol,
        position: position.find((p: any) => parseFloat(p.positionAmt) !== 0),
        openOrders
      });
    } else {
      // 获取所有持仓和挂单
      const positions = await client.futuresPositionRisk();
      const openOrders = await client.futuresOpenOrders();
      
      const activePositions = positions.filter((p: any) => parseFloat(p.positionAmt) !== 0);
      
      return NextResponse.json({
        positions: activePositions,
        openOrders
      });
    }

  } catch (error: any) {
    console.error('获取持仓信息失败:', error);
    
    return NextResponse.json(
      { error: error.message || '获取持仓信息失败' },
      { status: 500 }
    );
  }
}