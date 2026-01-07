import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo/page-metadata";
import { CookiesContent } from "./cookies-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata("/cookies", locale);
}

export default function CookiesPage() {
  return <CookiesContent />;
}
