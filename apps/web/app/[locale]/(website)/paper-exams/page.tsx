import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo/page-metadata";
import { SoftwareApplicationSchema } from "@/components/seo/json-ld";
import { PaperExamsContent } from "./paper-exams-content";


type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata("/paper-exams", locale);
}

export default async function PaperExamsPage() {

  return (
    <>
      <SoftwareApplicationSchema
        name="ProfeVision OMR Scanner"
        description="Scan and grade paper exams instantly with your phone camera."
        operatingSystem="Android, iOS"
        applicationCategory="mobile application"
      />
      <PaperExamsContent />
    </>
  );
}
