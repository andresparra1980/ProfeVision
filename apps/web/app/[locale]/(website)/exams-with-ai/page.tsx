import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo/page-metadata";
import { ExamsWithAIContent } from "./exams-with-ai-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata("/exams-with-ai", locale);
}

export default function ExamsWithAIPage() {
  return <ExamsWithAIContent />;
}
