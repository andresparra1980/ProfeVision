import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo/page-metadata";
import { SoftwareApplicationSchema } from "@/components/seo/json-ld";
import { MobileAppContent } from "./mobile-app-content";


type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata("/mobile-app", locale);
}

export default async function MobileAppPage() {

  return (
    <>
      <SoftwareApplicationSchema
        name="ProfeVision App"
        description="The best app to scan and grade paper exams with AI."
        operatingSystem="Android, iOS"
        applicationCategory="EducationalApplication"
      />
      <MobileAppContent />
    </>
  );
}
