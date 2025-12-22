import { NextResponse } from 'next/server';

// 简单的内存缓存
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1分钟缓存

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'BTC';
    const cacheKey = `analysis-${symbol}`;
    
    // 检查缓存
    const cached = cache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      console.log(`使用缓存的${symbol}分析数据`);
      return new Response(cached.data.stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Cache': 'HIT',
        },
      });
    }

    // 如果没有缓存或缓存过期，调用优化版API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/mastra-analysis-optimized?symbol=${symbol}`);
    
    if (!response.ok) {
      throw new Error(`优化版API调用失败: ${response.status}`);
    }

    // 读取流数据
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const chunks: string[] = [];
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(decoder.decode(value, { stream: false }));
    }
    
    const streamData = chunks.join('');
    
    // 缓存数据
    cache.set(cacheKey, {
      data: { stream: streamData },
      timestamp: now
    });

    // 返回流数据
    return new Response(streamData, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Cache': 'MISS',
      },
    });

  } catch (error) {
    console.error('缓存API调用失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI分析失败' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';