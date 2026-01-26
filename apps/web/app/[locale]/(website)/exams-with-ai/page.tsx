import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo/page-metadata";
import { SoftwareApplicationSchema } from "@/components/seo/json-ld";
import { ExamsWithAIContent } from "./exams-with-ai-content";


type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata("/exams-with-ai", locale);
}

export default async function ExamsWithAIPage() {

  return (
    <>
      <SoftwareApplicationSchema
        name="ProfeVision AI Exam Generator"
        description="Pedagogical AI assistant that thinks like an instructional designer."
        applicationCategory="WebApplication"
        operatingSystem="Web, Android, iOS, Windows, macOS, Linux"
      />
      <ExamsWithAIContent />
    </>
  );
}
