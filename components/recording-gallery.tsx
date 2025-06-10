"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Download, Trash2, Video, Monitor, Camera } from "lucide-react"
import { formatBytes } from "@/lib/utils"
import RecordingTimer from "./recording-timer"

interface Recording {
  id: string
  name: string
  url: string
  type: "webcam" | "screen"
  date: Date
  duration: number
  size: number
}

interface RecordingGalleryProps {
  recordings: Recording[]
  onDownload: (recording: Recording) => void
  onDelete: (id: string) => void
}

export default function RecordingGallery({ recordings, onDownload, onDelete }: RecordingGalleryProps) {
  if (recordings.length === 0) {
    return (
      <div className="text-center py-12">
        <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium mb-2">No recordings yet</h3>
        <p className="text-muted-foreground">Your recordings will appear here after you create them</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recordings.map((recording) => (
        <Card key={recording.id} className="overflow-hidden">
          <div className="aspect-video bg-slate-950 relative">
            <video src={recording.url} className="w-full h-full object-contain" controls />
            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              {recording.type === "webcam" ? <Camera className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
              <RecordingTimer seconds={recording.duration} />
            </div>
          </div>
          <CardContent className="p-4">
            <h3 className="font-medium truncate" title={recording.name}>
              {recording.name}
            </h3>
            <div className="text-sm text-muted-foreground mt-1 space-y-1">
              <p>{new Date(recording.date).toLocaleString()}</p>
              <p>{formatBytes(recording.size)}</p>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-between gap-2">
            <Button variant="outline" size="sm" className="w-full" onClick={() => onDownload(recording)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" className="w-auto" onClick={() => onDelete(recording.id)}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
