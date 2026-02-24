import { NextResponse } from "next/server"

// File uploads are no longer supported - YouTube URLs only.
export async function POST() {
  return NextResponse.json(
    { error: "File upload not supported. Please use a YouTube URL instead." },
    { status: 410 }
  )
}
