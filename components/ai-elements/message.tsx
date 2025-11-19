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
      "group flex w-full items-end justify-end gap-2 py-4",
      from === "user" ? "is-user" : "is-assistant flex-row-reverse justify-end",
      className
    )}
    {...props}
  />
);

const messageContentVariants = cva(
  "is-user:dark flex flex-col gap-2 overflow-hidden rounded-lg text-xs sm:text-sm",
  {
    variants: {
      variant: {
        contained: [
          "max-w-[80%] px-4 py-3",
          // User bubble: Light -> white bg with black text; Dark -> near-black bg with white text
          "group-[.is-user]:bg-black group-[.is-user]:text-white dark:group-[.is-user]:bg-zinc-100 dark:group-[.is-user]:text-zinc-900",
          // Assistant bubble (LLM):
          // Light mode: purple emphasis with white text; Dark mode: lighter purple with foreground text
          "group-[.is-assistant]:bg-purple-600 group-[.is-assistant]:text-white dark:group-[.is-assistant]:bg-purple-500 dark:group-[.is-assistant]:text-foreground",
        ],
        flat: [
          // User flat bubble mirrors contained colors
          "group-[.is-user]:max-w-[80%] group-[.is-user]:bg-black group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-black dark:group-[.is-user]:bg-zinc-100 dark:group-[.is-user]:text-zinc-900",
          // Assistant flat variant: purple text emphasis in both themes
          "group-[.is-assistant]:text-purple-700 dark:group-[.is-assistant]:text-purple-400",
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
