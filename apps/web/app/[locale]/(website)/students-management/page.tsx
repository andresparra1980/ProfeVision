import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo/page-metadata";
import { StudentsManagementPageContent } from "./students-management-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata("/students-management", locale);
}

export default function StudentsManagementPage() {
  return <StudentsManagementPageContent />;
}
