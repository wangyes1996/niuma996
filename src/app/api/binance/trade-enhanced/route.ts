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
      action, // 操作类型: buy, sell, set_stop_loss, set_take_profit, move_stop_loss, move_take_profit, close_position, cancel_order, batch_orders
      symbol, // 交易对: BTCUSDT, ETHUSDT等
      quantity, // 数量
      price, // 价格（限价单使用）
      stopPrice, // 止损/止盈价格
      orderType = 'MARKET', // 订单类型: MARKET, LIMIT, STOP_MARKET, TAKE_PROFIT_MARKET
      leverage, // 杠杆倍数
      positionSide = 'BOTH', // 持仓方向: LONG, SHORT, BOTH
      reduceOnly = false, // 是否只减仓
      orderId, // 订单ID（用于取消订单）
      orders // 批量订单数组
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
        } else if (orderType === 'STOP_MARKET') {
          // 止损市价单
          if (!stopPrice) {
            return NextResponse.json(
              { error: '止损市价单需要提供stopPrice参数' },
              { status: 400 }
            );
          }
          result = await client.futuresOrder({
            symbol,
            side,
            type: 'STOP_MARKET',
            quantity: parseFloat(quantity),
            stopPrice: parseFloat(stopPrice),
            positionSide,
            reduceOnly
          });
        } else if (orderType === 'TAKE_PROFIT_MARKET') {
          // 止盈市价单
          if (!stopPrice) {
            return NextResponse.json(
              { error: '止盈市价单需要提供stopPrice参数' },
              { status: 400 }
            );
          }
          result = await client.futuresOrder({
            symbol,
            side,
            type: 'TAKE_PROFIT_MARKET',
            quantity: parseFloat(quantity),
            stopPrice: parseFloat(stopPrice),
            positionSide,
            reduceOnly
          });
        }
        break;

      case 'close_position':
        // 平仓操作 - 一键平仓
        const positions = await client.futuresPositionRisk();
        const positionToClose = positions.find((p: any) => 
          p.symbol === symbol && parseFloat(p.positionAmt) !== 0
        );
        
        if (!positionToClose) {
          return NextResponse.json(
            { error: '未找到该交易对的持仓' },
            { status: 400 }
          );
        }

        const closeSide = parseFloat(positionToClose.positionAmt) > 0 ? 'SELL' : 'BUY';
        const closeQuantity = Math.abs(parseFloat(positionToClose.positionAmt));
        
        result = await client.futuresMarketOrder({
          symbol,
          side: closeSide,
          quantity: closeQuantity,
          positionSide: positionToClose.positionSide,
          reduceOnly: true
        });
        break;

      case 'cancel_order':
        // 取消订单
        if (!orderId) {
          return NextResponse.json(
            { error: '取消订单需要提供orderId参数' },
            { status: 400 }
          );
        }
        
        result = await client.futuresCancelOrder({
          symbol,
          orderId: parseInt(orderId)
        });
        break;

      case 'cancel_all_orders':
        // 取消所有订单
        result = await client.futuresCancelAllOpenOrders({ symbol });
        break;

      case 'batch_orders':
        // 批量下单
        if (!orders || !Array.isArray(orders) || orders.length === 0) {
          return NextResponse.json(
            { error: '批量下单需要提供orders数组参数' },
            { status: 400 }
          );
        }
        
        // 验证所有订单
        for (const order of orders) {
          if (!order.side || !order.quantity) {
            return NextResponse.json(
              { error: '批量订单中每个订单必须包含side和quantity参数' },
              { status: 400 }
            );
          }
        }
        
        result = await client.futuresBatchOrders(orders);
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
        const currentPositions = await client.futuresPositionRisk();
        const currentPosition = currentPositions.find((p: any) => p.symbol === symbol && parseFloat(p.positionAmt) !== 0);
        
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
      message: '操作成功',
      action,
      symbol,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('币安交易操作失败:', error);
    
    // 处理币安API错误
    let errorMessage = '操作失败';
    if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        action,
        symbol,
        timestamp: new Date().toISOString()
      },
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
    const detailed = searchParams.get('detailed') === 'true';

    if (symbol) {
      // 获取特定交易对的详细信息
      const [position, openOrders, trades, leverage] = await Promise.all([
        client.futuresPositionRisk({ symbol }).catch(() => []),
        client.futuresOpenOrders({ symbol }).catch(() => []),
        detailed ? client.futuresUserTrades({ symbol, limit: 10 }).catch(() => []) : Promise.resolve([]),
        client.futuresLeverageBracket({ symbol }).catch(() => null)
      ]);
      
      const currentPosition = position.find((p: any) => parseFloat(p.positionAmt) !== 0);
      
      return NextResponse.json({
        symbol,
        position: currentPosition,
        openOrders,
        recentTrades: trades,
        leverageInfo: leverage,
        timestamp: new Date().toISOString()
      });
    } else {
      // 获取所有持仓和挂单（并行处理）
      const [positions, openOrders, account] = await Promise.all([
        client.futuresPositionRisk().catch(() => []),
        client.futuresOpenOrders().catch(() => []),
        client.futuresAccount().catch(() => null)
      ]);
      
      const activePositions = positions.filter((p: any) => parseFloat(p.positionAmt) !== 0);
      
      return NextResponse.json({
        positions: activePositions,
        openOrders,
        accountInfo: account ? {
          totalWalletBalance: account.totalWalletBalance,
          totalUnrealizedProfit: account.totalUnrealizedProfit,
          totalMarginBalance: account.totalMarginBalance,
          availableBalance: account.availableBalance
        } : null,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error: any) {
    console.error('获取持仓信息失败:', error);
    
    return NextResponse.json(
      { 
        error: error.message || '获取持仓信息失败',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';