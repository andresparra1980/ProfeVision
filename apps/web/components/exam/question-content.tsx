import React from 'react';

interface QuestionContentProps {
  html: string;
  className?: string;
}

/**
 * Component to safely render HTML content for exam questions
 * This component uses dangerouslySetInnerHTML which is safe in this context
 * because we are only rendering content created by teachers within our rich text editor
 */
export function QuestionContent({ html, className = '' }: QuestionContentProps) {
  return (
    <div 
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
} 