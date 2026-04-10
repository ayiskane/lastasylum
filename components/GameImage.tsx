'use client'
import { useState } from 'react'

interface GameImageProps {
  src: string
  alt: string
  fallback?: string
  className?: string
}

export default function GameImage({ src, alt, fallback = '⚔️', className = '' }: GameImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed || !src) {
    return (
      <div className={`flex items-center justify-center text-2xl ${className}`}>
        {fallback}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain ${className}`}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  )
}
