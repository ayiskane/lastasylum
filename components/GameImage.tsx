'use client'
import { useState } from 'react'

interface GameImageProps {
  src: string
  alt: string
  fallback?: string
  fallbackSrc?: string
  className?: string
}

export default function GameImage({ src, alt, fallback = '⚔️', fallbackSrc, className = '' }: GameImageProps) {
  const [stage, setStage] = useState<'primary' | 'fallback' | 'emoji'>('primary')

  if (stage === 'emoji' || (!src && !fallbackSrc)) {
    return (
      <div className={`flex items-center justify-center text-2xl ${className}`}>
        {fallback}
      </div>
    )
  }

  const currentSrc = stage === 'primary' ? (src || fallbackSrc || '') : (fallbackSrc || '')

  if (!currentSrc) {
    return (
      <div className={`flex items-center justify-center text-2xl ${className}`}>
        {fallback}
      </div>
    )
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`object-contain ${className}`}
      onError={() => {
        if (stage === 'primary' && fallbackSrc && fallbackSrc !== src) {
          setStage('fallback')
        } else {
          setStage('emoji')
        }
      }}
      loading="lazy"
    />
  )
}
