import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo/page-metadata";
import { SubjectsManagementPageContent } from "./subjects-management-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata("/subjects-management", locale);
}

export default function SubjectsManagementPage() {
  return <SubjectsManagementPageContent />;
}
