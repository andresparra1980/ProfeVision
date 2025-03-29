import { UploadButton as UTUploadButton } from "@uploadthing/react";
import { toast } from "sonner";
import { type OurFileRouter } from "@/app/api/uploadthing/core";

interface UploadButtonProps {
  endpoint: keyof OurFileRouter;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: Error) => void;
  className?: string;
}

export function UploadButton({
  endpoint,
  onUploadComplete,
  onUploadError,
  className,
}: UploadButtonProps) {
  return (
    <UTUploadButton<OurFileRouter, keyof OurFileRouter>
      endpoint={endpoint}
      onClientUploadComplete={(res) => {
        if (res && res.length > 0 && res[0].url) {
          toast.success("Archivo subido correctamente");
          onUploadComplete?.(res[0].url);
        }
      }}
      onUploadError={(error: Error) => {
        toast.error(`Error: ${error.message}`);
        onUploadError?.(error);
      }}
      className={className}
    />
  );
} 