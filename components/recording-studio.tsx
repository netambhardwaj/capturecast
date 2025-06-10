"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Camera, Monitor, Pause, Play, Save, Settings, StopCircle, Video, Volume2, Loader2 } from 'lucide-react'
import RecordingTimer from "./recording-timer"
import RecordingGallery from "./recording-gallery"

type RecordingState = "idle" | "recording" | "paused" | "stopped"
type StreamType = "webcam" | "screen"
type RecordingQuality = "low" | "medium" | "high"

interface Recording {
  id: string
  name: string
  url: string
  type: StreamType
  date: Date
  duration: number
  size: number
}

export default function RecordingStudio() {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle")
  const [streamType, setStreamType] = useState<StreamType>("webcam")
  const [downloadUrl, setDownloadUrl] = useState<string>()
  const [recordingName, setRecordingName] = useState("My Recording")
  const [recordingQuality, setRecordingQuality] = useState<RecordingQuality>("medium")
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoVolume, setVideoVolume] = useState(50)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("record")

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recorderChunkRef = useRef<Blob[]>([])
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const { toast } = useToast()

  // Quality settings based on selected quality
  const getQualitySettings = () => {
    switch (recordingQuality) {
      case "low":
        return { videoBitsPerSecond: 1000000, audioBitsPerSecond: 64000 }
      case "high":
        return { videoBitsPerSecond: 5000000, audioBitsPerSecond: 128000 }
      case "medium":
      default:
        return { videoBitsPerSecond: 2500000, audioBitsPerSecond: 96000 }
    }
  }

  const getMediaStream = async (type: StreamType) => {
    try {
      setIsLoading(true)
      let stream: MediaStream

      if (type === "webcam") {
        // Request webcam and microphone
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: audioEnabled,
        })
      } else {
        // Request screen recording along with system audio (if supported)
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            displaySurface: "monitor",
            logicalSurface: true,
            cursor: "always",
          },
          audio: audioEnabled
            ? {
                echoCancellation: true,
                noiseSuppression: true,
              }
            : false,
        })

        // Check if the stream contains audio tracks (some browsers may not support it)
        if (audioEnabled && stream.getAudioTracks().length === 0) {
          toast({
            title: "Audio not captured",
            description: "Your browser may not support screen audio recording.",
            variant: "destructive",
          })
        }
      }

      setIsLoading(false)
      return stream
    } catch (error) {
      console.error("Error accessing media devices:", error)
      toast({
        title: "Permission denied",
        description: "Please allow access to your camera and microphone.",
        variant: "destructive",
      })
      setIsLoading(false)
      return null
    }
  }

  const startRecording = async (type: StreamType) => {
    const stream = await getMediaStream(type)
    if (!stream) return

    setStreamType(type)
    setRecordingState("recording")

    if (videoRef.current) {
      videoRef.current.srcObject = stream
      videoRef.current.volume = videoVolume / 100
    }

    const options = {
      mimeType: "video/webm;codecs=vp9,opus",
      ...getQualitySettings(),
    }

    try {
      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder
      recorderChunkRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recorderChunkRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(recorderChunkRef.current, { type: "video/webm" })
        const url = URL.createObjectURL(blob)
        const id = Date.now().toString()

        setDownloadUrl(url)

        // Add to recordings list
        const newRecording: Recording = {
          id,
          name: recordingName || `Recording-${id}`,
          url,
          type,
          date: new Date(),
          duration: recordingDuration,
          size: blob.size,
        }

        setRecordings((prev) => [newRecording, ...prev])

        if (videoRef.current) {
          videoRef.current.srcObject = null
          videoRef.current.src = url
          videoRef.current.controls = true
        }

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())

        toast({
          title: "Recording complete",
          description: "Your recording is ready to download.",
        })
      }

      // Start the timer
      startTimeRef.current = Date.now()
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setRecordingDuration(elapsed)
      }, 1000)

      mediaRecorder.start(1000) // Collect data every second

      toast({
        title: "Recording started",
        description: `${type === "webcam" ? "Webcam" : "Screen"} recording has begun.`,
      })
    } catch (error) {
      console.error("Error creating MediaRecorder:", error)
      toast({
        title: "Recording failed",
        description: "There was an error starting the recording. Please try again.",
        variant: "destructive",
      })
      setRecordingState("idle")
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.pause()
      setRecordingState("paused")

      // Pause the timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }

      toast({
        title: "Recording paused",
        description: "You can resume or stop the recording.",
      })
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === "paused") {
      mediaRecorderRef.current.resume()
      setRecordingState("recording")

      // Resume the timer
      const pausedTime = recordingDuration
      startTimeRef.current = Date.now() - pausedTime * 1000

      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setRecordingDuration(elapsed)
      }, 1000)

      toast({
        title: "Recording resumed",
        description: "Your recording is continuing.",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setRecordingState("stopped")

      // Stop the timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }

      // Switch to gallery tab
      setActiveTab("gallery")
    }
  }

  const downloadVideo = (url: string, filename: string) => {
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleDownload = () => {
    if (downloadUrl) {
      downloadVideo(downloadUrl, recordingName)
      toast({
        title: "Download started",
        description: "Your recording is being downloaded.",
      })
    }
  }

  const deleteRecording = (id: string) => {
    setRecordings((prev) => {
      const recording = prev.find((r) => r.id === id)
      if (recording) {
        URL.revokeObjectURL(recording.url)
      }
      return prev.filter((r) => r.id !== id)
    })

    toast({
      title: "Recording deleted",
      description: "The recording has been removed from your gallery.",
    })
  }

  const resetRecording = () => {
    setRecordingState("idle")
    setDownloadUrl(undefined)
    setRecordingDuration(0)
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.src = ""
      videoRef.current.controls = false
    }
  }

  // Update video volume when slider changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = videoVolume / 100
    }
  }, [videoVolume])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }

      // Revoke all object URLs
      recordings.forEach((recording) => {
        URL.revokeObjectURL(recording.url)
      })
    }
  }, [recordings])

  return (
    <div className="container py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
          <TabsTrigger value="record">
            <Video className="mr-2 h-4 w-4" />
            Record
          </TabsTrigger>
          <TabsTrigger value="gallery">
            <Save className="mr-2 h-4 w-4" />
            Gallery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="record" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recording Preview</CardTitle>
                <CardDescription>
                  {recordingState === "idle"
                    ? "Start a new recording by selecting a source below"
                    : recordingState === "recording"
                      ? "Recording in progress..."
                      : recordingState === "paused"
                        ? "Recording paused"
                        : "Recording complete"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center">
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                  )}

                  {recordingState === "idle" && !isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-400 z-0">
                      <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="px-4">Select a recording source to begin</p>
                    </div>
                  )}

                  <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    autoPlay
                    muted={streamType === "webcam"}
                  ></video>

                  {recordingState !== "idle" && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center gap-2">
                      <span className="animate-pulse h-2 w-2 rounded-full bg-white"></span>
                      <RecordingTimer seconds={recordingDuration} />
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2 justify-center">
                {recordingState === "idle" && (
                  <>
                    <Button
                      onClick={() => startRecording("webcam")}
                      className="flex items-center gap-2"
                      disabled={isLoading}
                    >
                      <Camera className="h-4 w-4" />
                      Record Webcam
                    </Button>
                    <Button
                      onClick={() => startRecording("screen")}
                      className="flex items-center gap-2"
                      disabled={isLoading}
                    >
                      <Monitor className="h-4 w-4" />
                      Record Screen
                    </Button>
                  </>
                )}

                {recordingState === "recording" && (
                  <>
                    <Button onClick={pauseRecording} variant="outline" className="flex items-center gap-2">
                      <Pause className="h-4 w-4" />
                      Pause
                    </Button>
                    <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2">
                      <StopCircle className="h-4 w-4" />
                      Stop
                    </Button>
                  </>
                )}

                {recordingState === "paused" && (
                  <>
                    <Button onClick={resumeRecording} variant="outline" className="flex items-center gap-2">
                      <Play className="h-4 w-4" />
                      Resume
                    </Button>
                    <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2">
                      <StopCircle className="h-4 w-4" />
                      Stop
                    </Button>
                  </>
                )}

                {recordingState === "stopped" && (
                  <>
                    <Button onClick={handleDownload} className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Download
                    </Button>
                    <Button onClick={resetRecording} variant="outline" className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      New Recording
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Settings
                </CardTitle>
                <CardDescription>Configure your recording options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="recording-name">Recording Name</Label>
                  <Input
                    id="recording-name"
                    value={recordingName}
                    onChange={(e) => setRecordingName(e.target.value)}
                    disabled={recordingState !== "idle" && recordingState !== "stopped"}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quality">Recording Quality</Label>
                  <Select
                    value={recordingQuality}
                    onValueChange={(value: RecordingQuality) => setRecordingQuality(value)}
                    disabled={recordingState !== "idle"}
                  >
                    <SelectTrigger id="quality">
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (1 Mbps)</SelectItem>
                      <SelectItem value="medium">Medium (2.5 Mbps)</SelectItem>
                      <SelectItem value="high">High (5 Mbps)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="audio-toggle" className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Record Audio
                  </Label>
                  <Switch
                    id="audio-toggle"
                    checked={audioEnabled}
                    onCheckedChange={setAudioEnabled}
                    disabled={recordingState !== "idle"}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="volume-slider">Playback Volume</Label>
                    <span className="text-sm text-muted-foreground">{videoVolume}%</span>
                  </div>
                  <Slider
                    id="volume-slider"
                    min={0}
                    max={100}
                    step={1}
                    value={[videoVolume]}
                    onValueChange={(value) => setVideoVolume(value[0])}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <CardTitle>Recording Gallery</CardTitle>
              <CardDescription>
                {recordings.length === 0
                  ? "Your recordings will appear here"
                  : `You have ${recordings.length} recording${recordings.length !== 1 ? "s" : ""}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecordingGallery
                recordings={recordings}
                onDownload={(recording) => downloadVideo(recording.url, recording.name)}
                onDelete={deleteRecording}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
