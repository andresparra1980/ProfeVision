'use client';

import { useTranslations, useLocale } from 'next-intl';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQSchema } from "@/components/seo/json-ld";

export function ContactContent() {
  const t = useTranslations('common');
  const locale = useLocale();

  const faqs = [
    {
      question: t('contact.faq.q1', { defaultValue: "How can I reset my password?" }),
      answer: t('contact.faq.a1', { defaultValue: "You can reset your password by clicking on 'Forgot Password' at the login screen." }),
    },
    {
      question: t('contact.faq.q2', { defaultValue: "Where can I find the documentation?" }),
      answer: t('contact.faq.a2', { defaultValue: "You can find all official documentation and user guides at https://docs.profevision.com" }),
    },
    {
      question: t('contact.faq.q3', { defaultValue: "Is there a free trial?" }),
      answer: t('contact.faq.a3', { defaultValue: "Yes, we offer a free tier with limited scans and AI credits per month." }),
    },
    {
      question: t('contact.faq.q4', { defaultValue: "How do I export grades?" }),
      answer: t('contact.faq.a4', { defaultValue: "You can export grades to CSV or Excel from the Reports section in your dashboard." }),
    },
  ];

  const renderAnswer = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        // Append locale to docs URL if it matches the docs domain
        let finalUrl = part;
        if (part.includes('docs.profevision.com')) {
          finalUrl = `${part.replace(/\/$/, '')}/${locale}/docs`;
        }

        return (
          <a
            key={index}
            href={finalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <FAQSchema data={faqs} />
      <h1 className="text-4xl font-bold text-center mb-8">{t('contact.title')}</h1>
      <div className="max-w-4xl mx-auto">
        <p className="text-lg text-muted-foreground text-center mb-8">
          {t('contact.subtitle')}
        </p>

        <div className="flex justify-center mb-16">
          <div className="w-full max-w-lg">
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <h2 className="text-2xl font-semibold mb-4">{t('contact.support.title')}</h2>
              <div className="space-y-4">
                <div>
                  <strong>{t('contact.support.email')}</strong> soporte@profevision.com
                </div>
                <div>
                  <strong>{t('contact.support.knowledge')}</strong>{' '}
                  <a
                    href={`https://docs.profevision.com/${locale}/docs`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {t('contact.support.knowledgeBase')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            {t('contact.faq.title', { defaultValue: "Frequently Asked Questions" })}
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-0 bg-popover-foreground rounded-lg shadow-sm">
                <AccordionTrigger className="text-left px-6 py-4 text-popover hover:no-underline hover:opacity-80 rounded-lg font-medium">{faq.question}</AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <p className="text-popover opacity-80">{renderAnswer(faq.answer)}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

      </div>
    </div>
  )
} 
