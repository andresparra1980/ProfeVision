import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo/page-metadata";
import { HomeContent } from "./home-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata("/", locale);
}

export default function HomePage() {
  return <HomeContent />;
}
