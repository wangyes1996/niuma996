// app/api/mcp/call/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { tool, arguments: args } = await req.json();

  if (tool !== "crypto_indicators") {
    return NextResponse.json(
      { error: "Unknown tool" },
      { status: 400 }
    );
  }

  // 🔥 真正执行能力
  const res = await fetch(
    "http://154.36.184.107:3000/api/crypto/indicators",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args)
    }
  );

  const result = await res.json();

  return NextResponse.json({ result });
}
