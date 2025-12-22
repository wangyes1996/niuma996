#!/usr/bin/env node

/**
 * 智能交易定时器脚本
 * 每5分钟执行一次市场分析+仓位建议+自主操作
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');

// 配置
const CONFIG = {
  baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  symbols: ['BTC'], // 只监控BTC交易对
  interval: 5 * 60 * 1000, // 5分钟间隔
  logFile: path.join(__dirname, '../logs/smart-trade.log'),
  maxRetries: 3,
  retryDelay: 5000
};

// 日志函数
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  
  console.log(logMessage.trim());
  
  // 确保日志目录存在
  const logDir = path.dirname(CONFIG.logFile);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  fs.appendFileSync(CONFIG.logFile, logMessage);
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 重试机制
async function retry(fn, retries = CONFIG.maxRetries) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      log(`第${i + 1}次尝试失败: ${error.message}`, 'ERROR');
      if (i === retries - 1) throw error;
      await delay(CONFIG.retryDelay);
    }
  }
}

// 调用智能交易API
async function callSmartTradeAPI(symbol, autoExecute = true) {
  const url = `${CONFIG.baseUrl}/api/ai/smart-trade`;
  
  log(`开始分析 ${symbol} 的市场数据并执行智能交易...`);
  
  try {
    const response = await axios.post(url, {
      symbol,
      autoExecute
    }, {
      timeout: 60000, // 60秒超时
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = response.data;
    
    if (result.error) {
      log(`${symbol} 智能交易失败: ${result.error}`, 'ERROR');
      return null;
    }
    
    log(`${symbol} 智能交易执行成功`);
    log(`分析结果: ${result.analysis?.substring(0, 200)}...`);
    
    if (result.tradeInstructions && result.tradeInstructions.length > 0) {
      log(`${symbol} 交易指令: ${JSON.stringify(result.tradeInstructions)}`);
    }
    
    if (result.executedTrades && result.executedTrades.length > 0) {
      log(`${symbol} 已执行交易: ${result.executedTrades.length} 笔`);
      result.executedTrades.forEach((trade, index) => {
        log(`  交易 ${index + 1}: ${JSON.stringify(trade)}`);
      });
    }
    
    return result;
    
  } catch (error) {
    log(`${symbol} 智能交易API调用失败: ${error.message}`, 'ERROR');
    throw error;
  }
}

// 执行一轮智能交易分析
async function executeSmartTradeRound() {
  log('=== 开始新一轮智能交易分析 ===');
  
  const results = {};
  
  for (const symbol of CONFIG.symbols) {
    try {
      const result = await retry(() => callSmartTradeAPI(symbol));
      results[symbol] = result;
      
      // 在交易对之间添加短暂延迟，避免API过载
      if (symbol !== CONFIG.symbols[CONFIG.symbols.length - 1]) {
        await delay(2000);
      }
      
    } catch (error) {
      log(`${symbol} 智能交易完全失败，跳过该币种`, 'ERROR');
      results[symbol] = null;
    }
  }
  
  log('=== 本轮智能交易分析完成 ===');
  return results;
}

// 主循环函数
async function main() {
  log('智能交易定时器启动');
  log(`监控币种: ${CONFIG.symbols.join(', ')}`);
  log(`执行间隔: ${CONFIG.interval / 1000 / 60} 分钟`);
  log(`日志文件: ${CONFIG.logFile}`);
  
  // 立即执行第一次
  await executeSmartTradeRound();
  
  // 使用node-schedule设置定时器，每5分钟执行一次
  const job = schedule.scheduleJob('*/5 * * * *', async () => {
    try {
      log('定时器触发，开始执行智能交易分析...');
      await executeSmartTradeRound();
      log('定时器执行完成');
    } catch (error) {
      log(`定时器执行失败: ${error.message}`, 'ERROR');
    }
  });
  
  log('定时器已设置，等待下一次执行...');
  log('下次执行时间: ' + job.nextInvocation().toString());
  
  return job; // 返回job对象以便外部可以控制
}



process.on('uncaughtException', (error) => {
  log(`未捕获的异常: ${error.message}`, 'ERROR');
  log(error.stack, 'ERROR');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`未处理的Promise拒绝: ${reason}`, 'ERROR');
  process.exit(1);
});

// 启动程序
if (require.main === module) {
  let job;
  
  main().then((scheduledJob) => {
    job = scheduledJob;
    log('智能交易定时器已启动，使用node-schedule调度');
  }).catch(error => {
    log(`程序启动失败: ${error.message}`, 'FATAL');
    process.exit(1);
  });
  
  // 优雅退出时取消定时器
  process.on('SIGINT', () => {
    log('收到SIGINT信号，正在优雅退出...', 'WARN');
    if (job) {
      job.cancel();
      log('定时器已取消');
    }
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log('收到SIGTERM信号，正在优雅退出...', 'WARN');
    if (job) {
      job.cancel();
      log('定时器已取消');
    }
    process.exit(0);
  });
}

module.exports = { executeSmartTradeRound, callSmartTradeAPI };