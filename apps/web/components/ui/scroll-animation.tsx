"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

interface ScrollAnimationProps {
  children: ReactNode
  className?: string
  delay?: number
  animation?: "fade-up" | "fade-scale" | "slide-left" | "slide-right"
}

export function ScrollAnimation({
  children,
  className = "",
  delay = 0,
  animation = "fade-up",
}: ScrollAnimationProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [])

  const animationClasses = {
    "fade-up": "animate-fade-in-up",
    "fade-scale": "animate-fade-in-scale",
    "slide-left": "animate-slide-in-left",
    "slide-right": "animate-slide-in-right",
  }

  const delayStyle = delay > 0 ? { animationDelay: `${delay}ms` } : {}

  return (
    <div
      ref={ref}
      className={`scroll-animate-base ${isVisible ? animationClasses[animation] : "opacity-0"} ${className}`}
      style={delayStyle}
    >
      {children}
    </div>
  )
}
