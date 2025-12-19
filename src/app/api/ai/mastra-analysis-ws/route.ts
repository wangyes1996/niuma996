import { NextResponse } from 'next/server';
import { getTechnicalData } from '../mastra-analysis/route';
import { generateAnalysisWithMastra } from '../mastra-analysis/route';

export async function GET(request: Request) {
  try {
    // 创建ReadableStream来发送数据
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const { searchParams } = new URL(request.url);
          const symbol = searchParams.get('symbol') || 'BTC';

          // 获取技术指标数据
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: '正在获取技术指标数据...\n' })}\n\n`));
          const technicalData = await getTechnicalData(symbol);

          // 生成AI分析
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: '正在生成AI市场分析...\n' })}\n\n`));
          const analysis = await generateAnalysisWithMastra(symbol, technicalData);

          // 发送分析结果
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: analysis })}\n\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`));

          controller.close();
        } catch (error) {
          console.error('AI分析失败:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: error instanceof Error ? error.message : 'AI分析失败' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI分析失败' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
