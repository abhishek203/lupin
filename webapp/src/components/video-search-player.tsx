'use client'

import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Mock API function
const mockApiCall = async (query: string) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Return mock data
  return {
    videoId: "jHzIGGU-Ph0", // This is the ID for Rick Astley - Never Gonna Give You Up
    startTime: 5,
    endTime: 15
  }
}

export default function Component() {
  const [query, setQuery] = useState('')
  const [videoDetails, setVideoDetails] = useState<{
    videoId: string,
    startTime: number,
    endTime: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchCount, setSearchCount] = useState(0)

  const handleSearch = async () => {
    setIsLoading(true)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      console.log(apiUrl)
      const response = await fetch(`${apiUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }
      const result = await response.json()
      console.log('result',result)
      console.log('result start',result.startTime)
      setVideoDetails({
        videoId: "jHzIGGU-Ph0", // Hardcoded for now
        startTime: result.startTime,
        endTime: result.endTime
      })
      setSearchCount(prevCount => prevCount + 1) // Increment search count
    } catch (error) {
      console.error("Error fetching video details:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getYouTubeEmbedUrl = () => {
    if (!videoDetails) return 'https://www.youtube.com/embed/jHzIGGU-Ph0'
    const { videoId, startTime, endTime } = videoDetails
    console.log('detailsss',startTime,endTime)
    const urlx = `https://www.youtube.com/embed/${videoId}?start=${startTime}&end=${endTime}&autoplay=1&enablejsapi=1`
    console.log(urlx)
    return urlx
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
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </div>
      <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
        <iframe
          key={searchCount}
          src={getYouTubeEmbedUrl()}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; encrypted-media"
        ></iframe>
      </div>
      {videoDetails && (
        <div className="text-sm text-gray-600">
          Playing from {videoDetails.startTime}s to {videoDetails.endTime}s
        </div>
      )}
    </div>
  )
}
