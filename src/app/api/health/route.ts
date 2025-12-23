import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 简单的健康检查 - 检查环境变量
    const requiredEnvVars = ['DEEPSEEK_KEY', 'BINANCE_API_KEY', 'BINANCE_SECRET_KEY'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      return NextResponse.json({
        status: 'unhealthy',
        message: `缺少环境变量: ${missingEnvVars.join(', ')}`,
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    return NextResponse.json({
      status: 'healthy',
      message: '系统运行正常',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });

  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      message: `健康检查失败: ${error.message}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';