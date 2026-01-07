import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo/page-metadata";
import { ContactContent } from "./contact-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata("/contact", locale);
}

export default function ContactPage() {
  return <ContactContent />;
}
