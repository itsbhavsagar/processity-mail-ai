import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "commandmail",
    timestamp: new Date().toISOString(),
  });
}
