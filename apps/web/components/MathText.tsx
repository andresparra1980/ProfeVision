"use client";

import dynamic from "next/dynamic";
import React from "react";

// Dynamically import the actual component with SSR disabled to prevent 
// ESM module evaluation errors with remark/rehype plugins during server rendering or initial client bundle load.
const MathTextContent = dynamic(() => import("./MathTextContent"), {
  ssr: false,
  loading: () => <span className="animate-pulse bg-muted h-4 w-24 rounded inline-block" />
});

type Props = {
  text: string | null | undefined;
  className?: string;
  inline?: boolean;
};

export default function MathText(props: Props) {
  return <MathTextContent {...props} />;
}
