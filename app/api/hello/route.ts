import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Hello from Next API!",
    time: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  return NextResponse.json({
    received: body,
  });
}
