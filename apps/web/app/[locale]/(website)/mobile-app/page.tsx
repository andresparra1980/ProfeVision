import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo/page-metadata";
import { MobileAppContent } from "./mobile-app-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata("/mobile-app", locale);
}

export default function MobileAppPage() {
  return <MobileAppContent />;
}
