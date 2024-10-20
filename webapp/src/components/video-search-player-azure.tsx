'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

// Mock API function (replace with your actual Azure API call)
const mockApiCall = async (query: string) => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  return {
    startTime: 5,
    endTime: 15,
    videoPath: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  }
}

export function VideoSearchPlayerAzure() {
  const [query, setQuery] = useState('')
  const [videoDetails, setVideoDetails] = useState<{
    startTime: number,
    endTime: number,
    videoPath: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleSearch = async () => {
    setIsLoading(true)
    setError(null)
    setIsVideoReady(false)
    try {
      const result = await mockApiCall(query)
      setVideoDetails(result)
    } catch (error) {
      console.error("Error fetching video details:", error)
      setError("Failed to fetch video details. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const seekToStartTime = () => {
    if (videoRef.current && videoDetails) {
      videoRef.current.currentTime = videoDetails.startTime
      videoRef.current.play()
    }
  }

  const handleVideoLoaded = () => {
    setIsVideoReady(true)
    seekToStartTime()
  }

  useEffect(() => {
    if (videoDetails && videoRef.current) {
      videoRef.current.load() // Reload the video when the source changes
    }
  }, [videoDetails])

  const handleTimeUpdate = () => {
    if (videoRef.current && videoDetails) {
      if (videoRef.current.currentTime >= videoDetails.endTime) {
        videoRef.current.pause()
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Enter your search query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-grow"
        />
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </div>
      {error && <div className="text-red-500">{error}</div>}
      <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden relative">
        {!isVideoReady && videoDetails && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        <video
          ref={videoRef}
          src={videoDetails?.videoPath || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"}
          className="w-full h-full object-cover"
          controls
          onLoadedMetadata={handleVideoLoaded}
          onTimeUpdate={handleTimeUpdate}
        >
          Your browser does not support the video tag.
        </video>
      </div>
      {videoDetails && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Clip: {videoDetails.startTime}s to {videoDetails.endTime}s
          </div>
          <Button onClick={seekToStartTime} disabled={!isVideoReady}>
            Replay Clip
          </Button>
        </div>
      )}
    </div>
  )
}