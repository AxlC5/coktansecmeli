import { NextResponse } from "next/server"

// Projects are now stored in localStorage (client-side only).
// These API routes are no longer used but kept as stubs to avoid 404s.

export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

export async function PUT() {
  return NextResponse.json({ error: "Use client-side localStorage instead" }, { status: 410 })
}

export async function DELETE() {
  return NextResponse.json({ error: "Use client-side localStorage instead" }, { status: 410 })
}
