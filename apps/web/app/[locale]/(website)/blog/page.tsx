import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo/page-metadata";
import { BlogContent } from "./blog-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata("/blog", locale);
}

export default function BlogPage() {
  return <BlogContent />;
}
