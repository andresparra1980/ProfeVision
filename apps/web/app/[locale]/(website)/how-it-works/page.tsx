import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Script from "next/script";
import { generatePageMetadata } from "@/lib/seo/page-metadata";
import { HowItWorksContent } from "./how-it-works-content";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata("/how-it-works", locale);
}

export default async function HowItWorksPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });

  // FAQ structured data for rich snippets
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": t("howItWorks.faq.questions.q1.question"),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t("howItWorks.faq.questions.q1.answer"),
        },
      },
      {
        "@type": "Question",
        "name": t("howItWorks.faq.questions.q2.question"),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t("howItWorks.faq.questions.q2.answer"),
        },
      },
      {
        "@type": "Question",
        "name": t("howItWorks.faq.questions.q3.question"),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t("howItWorks.faq.questions.q3.answer"),
        },
      },
      {
        "@type": "Question",
        "name": t("howItWorks.faq.questions.q4.question"),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t("howItWorks.faq.questions.q4.answer"),
        },
      },
      {
        "@type": "Question",
        "name": t("howItWorks.faq.questions.q5.question"),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t("howItWorks.faq.questions.q5.answer"),
        },
      },
    ],
  };

  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <HowItWorksContent />
    </>
  );
}
