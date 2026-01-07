import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo/page-metadata";
import { TermsContent } from "./terms-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata("/terms", locale);
}

export default function TermsPage() {
  return <TermsContent />;
}
