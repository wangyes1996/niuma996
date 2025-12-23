#!/usr/bin/env node

/**
 * AI智能交易定时器脚本
 * 每5分钟执行一次AI分析和自动交易
 */

const schedule = require('node-schedule');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  symbol: 'BTC',
  interval: 5 * 60 * 1000, // 5分钟
  apiUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  logFile: path.join(__dirname, '../../logs/smart-trade.log'),
  maxRetries: 3,
  retryDelay: 5000,
};

// 确保日志目录存在
const logDir = path.dirname(CONFIG.logFile);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 日志函数
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  
  console.log(logMessage.trim());
  
  try {
    fs.appendFileSync(CONFIG.logFile, logMessage);
  } catch (error) {
    console.error('写入日志失败:', error.message);
  }
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 执行智能交易分析
async function executeSmartTradeAnalysis() {
  try {
    log(`开始执行${CONFIG.symbol}智能交易分析...`);
    
    // 调用自动交易API
    const response = await fetch(`${CONFIG.apiUrl}/api/ai/mastra-analysis-auto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbol: CONFIG.symbol }),
    });

    if (!response.ok) {
      throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // 记录分析结果
    log(`AI分析完成`);
    log(`分析内容: ${result.analysis?.substring(0, 200)}...`);
    
    if (result.decision) {
      log(`交易决策: ${JSON.stringify(result.decision)}`);
    }
    
    if (result.autoTrade) {
      if (result.autoTrade.success) {
        log(`自动交易执行成功 - 订单ID: ${result.autoTrade.orderId}`, 'SUCCESS');
      } else {
        log(`自动交易执行失败 - 错误: ${result.autoTrade.error}`, 'ERROR');
      }
    } else {
      log('未执行自动交易（持仓或置信度不足）');
    }
    
    return result;
    
  } catch (error) {
    log(`智能交易分析失败: ${error.message}`, 'ERROR');
    throw error;
  }
}

// 重试机制
async function executeWithRetry(func, retries = CONFIG.maxRetries) {
  for (let i = 0; i < retries; i++) {
    try {
      return await func();
    } catch (error) {
      log(`第${i + 1}次尝试失败: ${error.message}`, 'WARN');
      
      if (i === retries - 1) {
        throw error; // 最后一次尝试失败
      }
      
      log(`等待${CONFIG.retryDelay / 1000}秒后重试...`);
      await delay(CONFIG.retryDelay);
    }
  }
}

// 主执行函数
async function executeSmartTradeRound() {
  const startTime = Date.now();
  
  try {
    log('=== 开始新的智能交易轮次 ===');
    
    // 执行AI分析（带重试）
    const result = await executeWithRetry(executeSmartTradeAnalysis);
    
    const duration = Date.now() - startTime;
    log(`=== 智能交易轮次完成，耗时: ${duration}ms ===`);
    
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    log(`=== 智能交易轮次失败，耗时: ${duration}ms，错误: ${error.message} ===`, 'ERROR');
    throw error;
  }
}

// 健康检查
async function healthCheck() {
  try {
    const response = await fetch(`${CONFIG.apiUrl}/api/health`, {
      timeout: 10000
    }).catch(() => null);
    
    if (response && response.ok) {
      log('系统健康检查通过');
      return true;
    } else {
      log('系统健康检查失败，将在下次定时器触发时重试', 'WARN');
      return false;
    }
  } catch (error) {
    log(`健康检查异常: ${error.message}`, 'WARN');
    return false;
  }
}

// 初始化函数
async function initialize() {
  log('=== AI智能交易定时器启动 ===');
  log(`配置: 交易对=${CONFIG.symbol}, 间隔=${CONFIG.interval/1000}秒, API=${CONFIG.apiUrl}`);
  
  // 启动时立即执行一次
  log('启动时执行首次分析...');
  await executeSmartTradeRound().catch(error => {
    log(`启动分析失败: ${error.message}`, 'ERROR');
  });
  
  // 设置定时任务 - 每5分钟执行一次
  log('设置定时任务...');
  const job = schedule.scheduleJob('*/10 * * * *', async () => {
    try {
      log('定时器触发，开始执行智能交易分析...');
      
      // 健康检查
      const isHealthy = await healthCheck();
      if (!isHealthy) {
        log('系统未就绪，跳过本次执行');
        return;
      }
      
      await executeSmartTradeRound();
      log('定时器执行完成');
      
    } catch (error) {
      log(`定时器执行失败: ${error.message}`, 'ERROR');
    }
  });
  
  log('定时器设置完成，将在每5分钟的0秒触发');
  
  // 优雅关闭处理
  process.on('SIGTERM', () => {
    log('收到SIGTERM信号，正在关闭定时器...');
    job.cancel();
    log('定时器已关闭');
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    log('收到SIGINT信号，正在关闭定时器...');
    job.cancel();
    log('定时器已关闭');
    process.exit(0);
  });
  
  log('=== 初始化完成 ===');
}

// 错误处理
process.on('uncaughtException', (error) => {
  log(`未捕获的异常: ${error.message}`, 'ERROR');
  log(error.stack, 'ERROR');
});

process.on('unhandledRejection', (reason, promise) => {
  log(`未处理的Promise拒绝: ${reason}`, 'ERROR');
  log(`Promise: ${promise}`, 'ERROR');
});

// 启动定时器
if (require.main === module) {
  initialize().catch(error => {
    log(`初始化失败: ${error.message}`, 'FATAL');
    process.exit(1);
  });
}

module.exports = {
  executeSmartTradeRound,
  executeSmartTradeAnalysis,
  CONFIG
};