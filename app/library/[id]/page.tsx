"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { notFound } from "next/navigation"
import { LibraryWatchClient } from "./watch-client"
import { getProject, type Project } from "@/lib/projects-store"

export default function LibraryWatchPage() {
  const params = useParams()
  const id = params?.id as string
  const [project, setProject] = useState<Project | null | undefined>(undefined)

  useEffect(() => {
    if (id) {
      const p = getProject(id)
      setProject(p)
    }
  }, [id])

  if (project === undefined) return null // still loading

  if (!project) {
    notFound()
    return null
  }

  return (
    <LibraryWatchClient
      project={{
        id: project.id,
        title: project.title,
        videoUrl: project.video_url,
        videoType: project.video_type,
        interactions: project.interactions,
      }}
    />
  )
}
