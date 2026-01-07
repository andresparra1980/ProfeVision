import type { Metadata } from "next";
import { generatePageMetadata } from "@/lib/seo/page-metadata";
import { GroupsManagementPageContent } from "./groups-management-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata("/groups-management", locale);
}

export default function GroupsManagementPage() {
  return <GroupsManagementPageContent />;
}
