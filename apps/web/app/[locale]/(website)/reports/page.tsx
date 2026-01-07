import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo/page-metadata";
import { ReportsPageContent } from "./reports-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata("/reports", locale);
}

export default function ReportsPage() {
  return <ReportsPageContent />;
}
