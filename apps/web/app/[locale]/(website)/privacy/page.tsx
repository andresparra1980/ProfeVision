import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo/page-metadata";
import { PrivacyContent } from "./privacy-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata("/privacy", locale);
}

export default function PrivacyPage() {
  return <PrivacyContent />;
}
