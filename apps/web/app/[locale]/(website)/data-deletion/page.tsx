import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo/page-metadata";
import { DataDeletionPageContent } from "./data-deletion-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata("/data-deletion", locale);
}

export default function DataDeletionPage() {
  return <DataDeletionPageContent />;
}
