#!/usr/bin/env node

/**
 * AI分析接口测试脚本
 * 测试合并后的mastra-analysis接口
 */

const fetch = require('node-fetch');

const API_BASE = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// 测试配置
const TEST_CONFIG = {
  symbol: 'BTC',
  analysisMode: {
    enableAutoTrading: false
  },
  autoTradingMode: {
    enableAutoTrading: true,
    confidenceThreshold: 0.8
  }
};

// 日志函数
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type}] ${message}`);
}

// 测试分析模式
async function testAnalysisMode() {
  log('=== 测试分析模式 ===');
  
  try {
    const response = await fetch(`${API_BASE}/api/ai/mastra-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symbol: TEST_CONFIG.symbol,
        ...TEST_CONFIG.analysisMode
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    log(`分析模式测试结果:`, 'SUCCESS');
    log(`- 模式: ${result.mode}`);
    log(`- 交易对: ${result.symbol}`);
    log(`- 分析内容长度: ${result.analysis?.length || 0}字符`);
    log(`- 是否包含决策: ${result.decision ? '是' : '否'}`);
    log(`- 是否执行交易: ${result.autoTrade ? '是' : '否'}`);
    
    return result;
    
  } catch (error) {
    log(`分析模式测试失败: ${error.message}`, 'ERROR');
    throw error;
  }
}

// 测试自动交易模式
async function testAutoTradingMode() {
  log('=== 测试自动交易模式 ===');
  
  try {
    const response = await fetch(`${API_BASE}/api/ai/mastra-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symbol: TEST_CONFIG.symbol,
        ...TEST_CONFIG.autoTradingMode
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    log(`自动交易模式测试结果:`, 'SUCCESS');
    log(`- 模式: ${result.mode}`);
    log(`- 交易对: ${result.symbol}`);
    log(`- 置信度: ${result.confidence || 'N/A'}`);
    log(`- 决策: ${result.decision?.action || '无'}`);
    log(`- 交易执行: ${result.autoTrade?.success ? '成功' : '失败'}`);
    
    if (result.autoTrade) {
      log(`- 订单ID: ${result.autoTrade.orderId || 'N/A'}`);
      log(`- 执行价格: ${result.autoTrade.executedPrice || 'N/A'}`);
    }
    
    return result;
    
  } catch (error) {
    log(`自动交易模式测试失败: ${error.message}`, 'ERROR');
    throw error;
  }
}

// 测试错误处理
async function testErrorHandling() {
  log('=== 测试错误处理 ===');
  
  try {
    // 测试无效的交易对
    const response = await fetch(`${API_BASE}/api/ai/mastra-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        symbol: 'INVALID',
        enableAutoTrading: false
      }),
    });

    if (response.ok) {
      log('错误处理测试意外成功', 'WARN');
      return;
    }

    const errorResult = await response.json();
    log(`错误处理测试结果:`, 'INFO');
    log(`- HTTP状态: ${response.status}`);
    log(`- 错误信息: ${errorResult.error}`);
    
  } catch (error) {
    log(`错误处理测试异常: ${error.message}`, 'ERROR');
  }
}

// 主测试函数
async function runTests() {
  log('开始AI分析接口测试...');
  
  try {
    // 测试分析模式
    await testAnalysisMode();
    
    // 等待一下再测试自动交易模式
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 测试自动交易模式
    await testAutoTradingMode();
    
    // 等待一下再测试错误处理
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 测试错误处理
    await testErrorHandling();
    
    log('=== 所有测试完成 ===', 'SUCCESS');
    
  } catch (error) {
    log(`测试过程中出现错误: ${error.message}`, 'ERROR');
    process.exit(1);
  }
}

// 命令行参数处理
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
AI分析接口测试脚本

用法: node test-ai-analysis.js [选项]

选项:
  --analysis-only    仅测试分析模式
  --auto-only        仅测试自动交易模式
  --error-only       仅测试错误处理
  --help, -h         显示帮助信息

环境变量:
  NEXTAUTH_URL       API基础URL (默认: http://localhost:3000)
`);
  process.exit(0);
}

// 根据参数执行特定测试
async function runSpecificTests() {
  if (args.includes('--analysis-only')) {
    await testAnalysisMode();
  } else if (args.includes('--auto-only')) {
    await testAutoTradingMode();
  } else if (args.includes('--error-only')) {
    await testErrorHandling();
  } else {
    await runTests();
  }
  
  log('测试完成');
  process.exit(0);
}

// 执行测试
runSpecificTests().catch(error => {
  log(`测试执行失败: ${error.message}`, 'FATAL');
  process.exit(1);
});