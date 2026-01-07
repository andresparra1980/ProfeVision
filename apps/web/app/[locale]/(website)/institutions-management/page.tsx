import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo/page-metadata";
import { InstitutionsManagementPageContent } from "./institutions-management-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata("/institutions-management", locale);
}

export default function InstitutionsManagementPage() {
  return <InstitutionsManagementPageContent />;
}
