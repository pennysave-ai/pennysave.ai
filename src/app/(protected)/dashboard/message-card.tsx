"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Spinner } from "@heroui/spinner";
import { Avatar } from "@heroui/avatar";
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/theme";

export type MessageCardProps = React.HTMLAttributes<HTMLDivElement> & {
  avatar?: string;
  showCopy?: boolean;
  message?: React.ReactNode;
  status?: "success" | "failed";
  messageClassName?: string;
  isTyping: boolean;
  role: string;
  onMessageCopy?: (content: string | string[]) => void;
};

const MessageCard = React.forwardRef<HTMLDivElement, MessageCardProps>(
  (
    {
      avatar,
      isTyping,
      message,
      showCopy,
      status,
      role,
      onMessageCopy,
      className,
      messageClassName,
      ...props
    },
    ref
  ) => {
    const messageRef = React.useRef<HTMLDivElement>(null);

    const failedMessageClassName =
      status === "failed"
        ? "bg-danger-100/50 border border-danger-100 text-foreground"
        : "";
    const failedMessage = (
      <p>
        Something went wrong, if the issue persists please contact us through
        our help center at&nbsp;
        <Link href="mailto:support@pennysave.ai" size="sm">
          support@pennysave.ai
        </Link>
      </p>
    );

    const hasFailed = status === "failed";

    const handleCopy = React.useCallback(() => {
      let stringValue = "";

      if (typeof message === "string") {
        stringValue = message;
      } else if (Array.isArray(message)) {
        message.forEach((child) => {
          const childString =
            typeof child === "string"
              ? child
              : child?.props?.children?.toString();

          if (childString) {
            stringValue += childString + "\n";
          }
        });
      }

      const valueToCopy = stringValue || messageRef.current?.textContent || "";

      onMessageCopy?.(valueToCopy);
    }, [message, onMessageCopy]);

    return (
      <div {...props} ref={ref} className={cn("flex gap-3", className)}>
        <div className="relative flex-none">
          {role === "assistant" ? (
            <div className="realtive flex items-center justify-center w-8">
              {isTyping ? (
                <Spinner size="lg" className="absolute" />
              ) : (
                <div className="w-10 h-10 rounded-full border-solid absolute border-primary border-2" />
              )}
              <Icon
                width={28}
                icon="solar:star-fall-line-duotone"
                className="text-primary"
              />
            </div>
          ) : (
            <Badge
              isOneChar
              color="danger"
              content={
                <Icon
                  className="text-background"
                  icon="gravity-ui:circle-exclamation-fill"
                />
              }
              isInvisible={!hasFailed}
              placement="bottom-right"
              shape="circle"
            >
              <Avatar src={avatar} />
            </Badge>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <div
            className={cn(
              "relative w-full rounded-medium bg-content2 px-4 py-3 text-default-600",
              failedMessageClassName,
              messageClassName
            )}
          >
            <div
              ref={messageRef}
              className={cn("text-small", role === "assistant" && "pr-8")}
            >
              {hasFailed ? (
                failedMessage
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message?.toString()}
                </ReactMarkdown>
              )}
            </div>
            {showCopy && !hasFailed && (
              <div className="absolute right-2 top-2 flex rounded-full bg-content2 shadow-small">
                <Button
                  isIconOnly
                  radius="full"
                  size="sm"
                  variant="light"
                  onPress={handleCopy}
                >
                  <Icon
                    className="text-lg text-default-600"
                    icon="gravity-ui:copy"
                  />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default MessageCard;

MessageCard.displayName = "MessageCard";
