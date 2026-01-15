"use client";

import React, { useMemo } from "react";
import ReactMarkdown, { type Components as MarkdownComponents } from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

type Props = {
  text: string | null | undefined;
  className?: string;
  inline?: boolean;
};

export default function MathText({ text, className, inline }: Props) {
  const raw = typeof text === "string" ? text : "";
  // Normalize common escaping issue: double backslashes appear in content ($\\Delta x$) -> ($\Delta x$)
  const normalized = useMemo(() => raw.replace(/\\\\/g, "\\"), [raw]);

  const components: MarkdownComponents = inline
    ? {
      p: ({ children }) => (
        <span className="m-0 p-0 leading-normal align-middle">{children}</span>
      ),
    }
    : {
      p: ({ children }) => (
        <div className="my-1 leading-relaxed">{children}</div>
      ),
    };

  const Wrapper = inline ? "span" : "div";
  return (
    <Wrapper
      className={[
        className || "",
        inline
          ? "[&_.katex-display]:my-0 [&_.katex-display]:inline-block"
          : "[&_.katex-display]:my-1",
      ].join(" ")}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {normalized}
      </ReactMarkdown>
    </Wrapper>
  );
}
