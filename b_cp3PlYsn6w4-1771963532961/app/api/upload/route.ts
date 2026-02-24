"use server"

import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Dosya bulunamadi" }, { status: 400 })
    }

    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Dosya boyutu 500MB'dan buyuk olamaz" },
        { status: 400 }
      )
    }

    const allowedTypes = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Gecersiz dosya formati. MP4, WebM, OGG kullanin." },
        { status: 400 }
      )
    }

    const blob = await put(`videos/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Yukleme basarisiz" }, { status: 500 })
  }
}
