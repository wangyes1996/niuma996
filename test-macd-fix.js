// 测试MACD计算是否修复
const Binance = require('binance-api-node');
const { MACD } = require('technicalindicators');

async function testMACD() {
  const client = Binance();
  
  console.log('测试MACD计算...');
  
  // 测试不同时间框架
  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];
  
  for (const timeframe of timeframes) {
    try {
      console.log(`\n=== 测试 ${timeframe} 时间框架 ===`);
      
      // 获取50条数据
      const klines = await client.candles({
        symbol: 'BTCUSDT',
        interval: timeframe,
        limit: 50,
      });
      
      console.log(`获取到 ${klines.length} 条K线数据`);
      
      // 提取收盘价
      const closes = klines.map(k => parseFloat(k.close));
      
      // 计算MACD
      const macdResult = MACD.calculate({
        values: closes,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMA: false,
      });
      
      console.log(`MACD计算结果数量: ${macdResult.length}`);
      
      // 检查是否有有效值
      if (macdResult.length > 0) {
        const lastMACD = macdResult[macdResult.length - 1];
        console.log(`最后一个MACD值: DIF=${lastMACD.MACD}, DEA=${lastMACD.signal}, MACD柱=${lastMACD.histogram}`);
        console.log('✅ MACD计算成功！');
      } else {
        console.log('❌ MACD计算结果为空');
      }
      
    } catch (error) {
      console.error(`测试 ${timeframe} 失败:`, error.message);
    }
  }
}

testMACD().catch(console.error);