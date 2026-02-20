'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

// Initialize PostHog globally but defer it
let isPostHogInitialized = false;

function initPostHog() {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY && !isPostHogInitialized) {
        isPostHogInitialized = true;
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
            api_host: '/ingest', // Always use the proxy to avoid ad blockers
            ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
            person_profiles: 'identified_only',
            capture_pageview: false, // We capture manually
            capture_pageleave: true,
            loaded: (posthog) => {
                if (process.env.NODE_ENV === 'development') posthog.debug()
            }
        })
    }
}

function PostHogPageView() {
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        initPostHog()
        if (pathname && posthog) {
            let url = window.origin + pathname
            if (searchParams && searchParams.toString()) {
                url = url + `?${searchParams.toString()}`
            }
            posthog.capture('$pageview', {
                '$current_url': url,
            })
        }
    }, [pathname, searchParams])

    return null
}

function PostHogPageWrapper() {
    return (
        <Suspense fallback={null}>
            <PostHogPageView />
        </Suspense>
    )
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
    return (
        <PostHogProvider client={posthog}>
            <PostHogPageWrapper />
            {children}
        </PostHogProvider>
    )
}
