"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import { Avatar } from "@heroui/avatar";
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { Icon } from "@iconify/react";
import { cn } from "@heroui/theme";
import AiAvatar from "./ai-avatar";

export type MessageCardProps = React.HTMLAttributes<HTMLDivElement> & {
  avatar?: string;
  message?: React.ReactNode;
  status?: "success" | "failed";
  messageClassName?: string;
  isTyping: boolean;
  role: string;
  onMessageCopy?: (content: string | string[]) => void;
  currentTool: string | null;
};

const MessageCard = React.forwardRef<HTMLDivElement, MessageCardProps>(
  (
    {
      avatar,
      isTyping,
      message,
      status,
      role,
      onMessageCopy,
      className,
      messageClassName,
      currentTool,
      ...props
    },
    ref
  ) => {
    const messageRef = React.useRef<HTMLDivElement>(null);

    const mapToolToMessage = (tool: string) => {
      switch (tool) {
        case "createTransaction":
          return "Creating transaction";
        case "createCategory":
          return "Creating category";
        case "createAccount":
          return "Creating account";
        case "fetchUserTransactions":
          return "Analyzing transactions";
        default:
          return "Thinking";
      }
    };

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
              <AiAvatar loading={isTyping} />
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
              {isTyping && currentTool && (
                <div className="text-sm text-default-400 thinking-dots">
                  {mapToolToMessage(currentTool)}
                </div>
              )}
              {hasFailed ? (
                failedMessage
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {message?.toString()}
                </ReactMarkdown>
              )}
            </div>
            {role === "assistant" && !hasFailed && !currentTool && (
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
