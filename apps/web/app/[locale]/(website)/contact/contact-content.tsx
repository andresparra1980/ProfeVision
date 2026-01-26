'use client';

import { useTranslations } from 'next-intl';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQSchema } from "@/components/seo/json-ld";

export function ContactContent() {
  const t = useTranslations('common');

  const faqs = [
    {
      question: t('contact.faq.q1', { defaultValue: "How can I reset my password?" }),
      answer: t('contact.faq.a1', { defaultValue: "You can reset your password by clicking on 'Forgot Password' at the login screen." }),
    },
    {
      question: t('contact.faq.q2', { defaultValue: "Does ProfeVision work offline?" }),
      answer: t('contact.faq.a2', { defaultValue: "The mobile app allows scanning offline, but you need internet to sync grades." }),
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

  return (
    <div className="container mx-auto px-4 py-8">
      <FAQSchema data={faqs} />
      <h1 className="text-4xl font-bold text-center mb-8">{t('contact.title')}</h1>
      <div className="max-w-4xl mx-auto">
        <p className="text-lg text-muted-foreground text-center mb-8">
          {t('contact.subtitle')}
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-2xl font-semibold mb-4">{t('contact.info.title')}</h2>
              <div className="space-y-3">
                <div>
                  <strong>{t('contact.info.email')}</strong> info@profevision.com
                </div>
                <div>
                  <strong>{t('contact.info.phone')}</strong> +1 (555) 123-4567
                </div>
                <div>
                  <strong>{t('contact.info.schedule')}</strong> {t('contact.info.scheduleHours')}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-2xl font-semibold mb-4">{t('contact.support.title')}</h2>
              <div className="space-y-3">
                <div>
                  <strong>{t('contact.support.email')}</strong> soporte@profevision.com
                </div>
                <div>
                  <strong>{t('contact.support.liveChat')}</strong> {t('contact.support.liveChatAvailable')}
                </div>
                <div>
                  <strong>{t('contact.support.knowledge')}</strong> {t('contact.support.knowledgeBase')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            {t('contact.faq.title', { defaultValue: "Frequently Asked Questions" })}
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

      </div>
    </div>
  )
} 
