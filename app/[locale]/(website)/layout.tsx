'use client'

import { SiteHeader } from "@/components/shared/site-header"
import { SiteFooter } from "@/components/shared/site-footer"

export default function LocalizedWebsiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SiteHeader />
      <div className="pt-16">
        {children}
      </div>
      <SiteFooter />
    </>
  )
} 