const Binance = require('binance-api-node').default;
const { MACD } = require('technicalindicators');

async function testMACD() {
  const client = Binance();
  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];
  
  for (const timeframe of timeframes) {
    try {
      console.log(`\n=== 测试时间框架: ${timeframe} ===`);
      
      // 获取K线数据
      const klines = await client.candles({
        symbol: 'BTCUSDT',
        interval: timeframe,
        limit: 20,
      });
      
      if (!klines || klines.length === 0) {
        console.log(`获取${timeframe}时间框架的K线数据失败`);
        continue;
      }
      
      console.log(`获取到 ${klines.length} 条K线数据`);
      
      // 提取收盘价
      const closes = klines.map((k) => parseFloat(k.close));
      console.log('收盘价:', closes.slice(-5)); // 显示最后5个价格
      
      // 计算MACD
      const macdOutput = MACD.calculate({
        values: closes,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMA: false,
      });
      
      console.log(`MACD计算结果数量: ${macdOutput.length}`);
      console.log('最后几个MACD值:');
      macdOutput.slice(-3).forEach((item, index) => {
        console.log(`  DIF: ${item.MACD.toFixed(6)}, DEA: ${item.signal.toFixed(6)}, MACD: ${item.histogram.toFixed(6)}`);
      });
      
      // 计算对齐后的数据
      const offset = closes.length - macdOutput.length;
      console.log(`需要填充的null值数量: ${offset}`);
      
      const alignedMACD = {
        DIF: Array(offset).fill(null).concat(macdOutput.map(item => item.MACD)),
        DEA: Array(offset).fill(null).concat(macdOutput.map(item => item.signal)),
        MACD: Array(offset).fill(null).concat(macdOutput.map(item => item.histogram)),
      };
      
      console.log('对齐后的最后几个值:');
      const len = alignedMACD.DIF.length;
      for (let i = Math.max(0, len - 3); i < len; i++) {
        console.log(`  DIF: ${alignedMACD.DIF[i]}, DEA: ${alignedMACD.DEA[i]}, MACD: ${alignedMACD.MACD[i]}`);
      }
      
    } catch (error) {
      console.error(`处理${timeframe}时间框架时出错:`, error.message);
    }
  }
}

testMACD().then(() => {
  console.log('\n测试完成');
}).catch((error) => {
  console.error('测试出错:', error);
});