'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Target, DraftingCompass, FileCheck, ArrowRight } from "lucide-react";

export function WorkflowAnimation() {
    const t = useTranslations('common');
    const [step, setStep] = useState(0);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setStep((prev) => (prev + 1) % 6);
        }, step === 5 ? 4000 : 800);

        return () => clearTimeout(timeout);
    }, [step]);

    const isFinished = step === 5;

    return (
        <div className={`relative flex items-start justify-center text-muted-foreground/50 py-8 select-none transition-all duration-500`}>
            {/* Container for the steps - fades out when finished */}
            <div className={`flex items-start justify-center gap-2 md:gap-6 transition-opacity duration-300 ${isFinished ? 'opacity-0' : 'opacity-100'}`}>

                {/* Step 1: Objective */}
                <div className={`flex flex-col items-center transition-all duration-200 ${step >= 0 ? 'text-primary opacity-100' : 'opacity-40'}`}>
                    <Target className="h-8 w-8 md:h-12 md:w-12 mb-2" />
                    <span className="text-[10px] md:text-sm font-medium">{t('exams.hero.animation.objective')}</span>
                </div>

                <WorkflowArrow active={step >= 1} />

                {/* Step 2: Planning */}
                <div className={`flex flex-col items-center transition-all duration-200 ${step >= 2 ? 'text-primary opacity-100' : 'opacity-40'}`}>
                    <DraftingCompass className="h-8 w-8 md:h-12 md:w-12 mb-2" />
                    <span className="text-[10px] md:text-sm font-medium">{t('exams.hero.animation.planning')}</span>
                </div>

                <WorkflowArrow active={step >= 3} />

                {/* Step 3: Exam */}
                <div className={`flex flex-col items-center transition-all duration-400 ${step >= 4 ? 'text-primary opacity-100' : 'opacity-40'}`}>
                    <FileCheck className="h-8 w-8 md:h-12 md:w-12 mb-2" />
                    <span className="text-[10px] md:text-sm font-medium">{t('exams.hero.animation.exam')}</span>
                </div>
            </div>

            {/* Final Result - appears when finished */}
            {isFinished && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <ScaleUpText text={t('exams.hero.animation.result')} />
                </div>
            )}
        </div>
    );
}

function ScaleUpText({ text }: { text: string }) {
    // Split text into words for proper wrapping
    const words = text.toUpperCase().split(' ');

    return (
        <div className="flex flex-wrap justify-center items-center gap-x-6 md:gap-x-8 gap-y-2 px-4 max-w-full">
            {words.map((word, wordIndex) => (
                <span
                    key={wordIndex}
                    className="text-4xl md:text-7xl font-bold text-primary inline-block animate-scale-up-glow"
                    style={{
                        animationDelay: `${wordIndex * 0.1}s`,
                        animationFillMode: 'both',
                    }}
                >
                    {word}
                </span>
            ))}
            <style jsx global>{`
        @keyframes scale-up-glow {
          0% {
            transform: scale(0);
            opacity: 0;
            text-shadow: 0 0 0px hsl(var(--primary));
          }
          100% {
            transform: scale(1);
            opacity: 1;
            text-shadow: 0 0 20px hsl(var(--primary)), 0 0 40px hsl(var(--primary) / 0.5);
          }
        }
        .animate-scale-up-glow {
          animation: scale-up-glow 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
        </div>
    );
}

function WorkflowArrow({ active }: { active: boolean }) {
    return (
        // mt-[6px] centers 20px arrow on 32px icon (mobile)
        // md:mt-[14px] centers 20px arrow on 48px icon (desktop)
        <div className="relative mx-1 md:mx-4 flex items-center mt-[6px] md:mt-[14px]">
            {/* Arrow head aligned to end */}
            <ArrowRight className={`h-5 w-5 md:h-8 md:w-8 transition-colors duration-300 ${active ? 'text-primary' : 'text-muted-foreground/20'}`} />
        </div>
    );
}
