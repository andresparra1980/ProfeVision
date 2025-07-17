'use client'

import { SiteHeader } from "@/components/shared/site-header"
import { SiteFooter } from "@/components/shared/site-footer"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-grow pt-16 bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center h-full">
          {children}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
} 