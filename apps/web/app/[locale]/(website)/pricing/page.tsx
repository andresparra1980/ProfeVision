import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo/page-metadata";
import { PricingContent } from "./pricing-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata("/pricing", locale);
}

export default function PricingPage() {
  return <PricingContent />;
}
