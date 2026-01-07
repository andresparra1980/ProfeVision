import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo/page-metadata";
import { PaperExamsContent } from "./paper-exams-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata("/paper-exams", locale);
}

export default function PaperExamsPage() {
  return <PaperExamsContent />;
}
