import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, HTMLAttributes } from "react";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group flex w-full items-end justify-end gap-3 py-3 sm:py-4",
      from === "user" ? "is-user" : "is-assistant flex-row-reverse justify-end",
      className
    )}
    {...props}
  />
);

const messageContentVariants = cva(
  "flex flex-col gap-2 overflow-hidden rounded-[22px] border text-sm leading-6 shadow-sm backdrop-blur-sm",
  {
    variants: {
      variant: {
        contained: [
          "max-w-[88%] px-4 py-3.5 sm:max-w-[82%] sm:px-5",
          "group-[.is-user]:border-transparent group-[.is-user]:bg-[rgb(var(--chat-accent))] group-[.is-user]:text-white",
          "group-[.is-assistant]:border-black/8 group-[.is-assistant]:bg-white/92 group-[.is-assistant]:text-foreground dark:group-[.is-assistant]:border-white/10 dark:group-[.is-assistant]:bg-zinc-900/92",
        ],
        flat: [
          "max-w-[88%] border-transparent px-1 py-1 shadow-none sm:max-w-[82%]",
          "group-[.is-user]:bg-transparent group-[.is-user]:text-[rgb(var(--chat-accent))] dark:group-[.is-user]:text-[rgb(var(--chat-accent-ink))]",
          "group-[.is-assistant]:bg-transparent group-[.is-assistant]:text-muted-foreground",
        ],
      },
    },
    defaultVariants: {
      variant: "contained",
    },
  }
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof messageContentVariants>;

export const MessageContent = ({
  children,
  className,
  variant,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(messageContentVariants({ variant, className }))}
    {...props}
  >
    {children}
  </div>
);

export type MessageAvatarProps = ComponentProps<typeof Avatar> & {
  src: string;
  name?: string;
};

export const MessageAvatar = ({
  src,
  name,
  className,
  ...props
}: MessageAvatarProps) => (
  <Avatar className={cn("size-8 ring-1 ring-border", className)} {...props}>
    <AvatarImage alt="" className="mt-0 mb-0" src={src} />
    <AvatarFallback>{name?.slice(0, 2) || "ME"}</AvatarFallback>
  </Avatar>
);
