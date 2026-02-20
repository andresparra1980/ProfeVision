'use client';

import { useTranslations, useLocale } from 'next-intl';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQSchema } from "@/components/seo/json-ld";
import { ScrollAnimation } from "@/components/ui/scroll-animation";

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
            className="underline hover:opacity-80 font-medium"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero / Header Section */}
      <section className="py-12 md:py-20 relative overflow-hidden">
        {/* Mesh Gradient Background */}
        <div className="mesh-gradient" aria-hidden="true" />

        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full animate-float hidden md:block" style={{ animationDelay: '0s' }} />
        <div className="absolute top-40 right-20 w-12 h-12 bg-accent/20 rounded-lg rotate-45 animate-float-rotate hidden md:block" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-secondary/10 rounded-full animate-float-slow hidden md:block" style={{ animationDelay: '1s' }} />

        <div className="container mx-auto px-4 relative z-10">
          <FAQSchema data={faqs} />

          <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-6 font-display">
              {t('contact.title')}
            </h1>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <p className="text-lg md:text-xl text-muted-foreground text-center mb-12">
                {t('contact.subtitle')}
              </p>
            </div>

            <div className="flex justify-center mb-16">
              <ScrollAnimation delay={300} className="w-full max-w-lg">
                <div className="bg-card p-8 rounded-xl border border-primary/20 shadow-lg card-hover gradient-border relative z-20">
                  <div className="relative z-10">
                    <h2 className="text-2xl font-semibold mb-6">{t('contact.support.title')}</h2>
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <strong className="text-primary">{t('contact.support.email')}</strong>
                        <a href="mailto:help@profevision.com" className="hover:underline">help@profevision.com</a>
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
              </ScrollAnimation>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/50 relative">
        <div className="absolute inset-0 dots-pattern opacity-30" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            <ScrollAnimation>
              <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
                <div className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                  {t('contact.faq.badge')}
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-display">
                  {t('contact.faq.title')}
                </h2>
              </div>
            </ScrollAnimation>

            <ScrollAnimation delay={100}>
              <Accordion type="single" collapsible className="w-full space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border-0 bg-popover-foreground rounded-lg shadow-sm"
                  >
                    <AccordionTrigger className="text-left px-6 py-4 text-popover hover:no-underline hover:opacity-80 rounded-lg font-medium">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 pt-2">
                      <p className="text-popover opacity-80">{renderAnswer(faq.answer)}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollAnimation>
          </div>
        </div>
      </section>
    </div>
  );
}
