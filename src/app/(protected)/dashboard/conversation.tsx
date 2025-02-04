"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Spinner } from "@heroui/spinner";
import { Icon } from "@iconify/react";
import MessageCard from "./message-card";

interface Conversation {
  messages: {
    role: string;
    content: string;
  }[];
  isLoading: boolean;
  isTyping: boolean;
  responseStarted: boolean;
}

export default function Conversation({
  messages,
  isLoading,
  isTyping,
  responseStarted,
}: Conversation) {
  const { data } = useSession();
  const [lastMessageIndex, setLastMessageIndex] = useState<number>(0);
  useEffect(() => {
    const index = messages.findLastIndex(({ role }) => role === "assistant");
    setLastMessageIndex(index + 2);
  }, [responseStarted]);
  const handleMessageCopy = (content: string | string[]) => {
    navigator.clipboard.writeText(
      Array.isArray(content) ? content.join("") : content
    );
  };
  return (
    <div className="flex flex-col gap-4 px-1">
      {messages.map(({ role, content }, index) => (
        <MessageCard
          onMessageCopy={handleMessageCopy}
          key={index}
          isTyping={isTyping && index === lastMessageIndex}
          role={role}
          avatar={
            role === "assistant"
              ? "https://nextuipro.nyc3.cdn.digitaloceanspaces.com/components-images/avatar_ai.png"
              : data?.user?.image || ""
          }
          message={content}
          messageClassName={
            role === "user" ? "bg-content3 text-content3-foreground" : ""
          }
          showCopy={role === "assistant"}
          className={role === "user" ? "flex-row-reverse" : ""}
        />
      ))}
      {isLoading && (
        <div className="realtive flex items-center justify-start gap-2">
          <div className="w-10 h-10 flex items-center justify-center relative">
            <Spinner size="lg" className="absolute" />
            <Icon
              width={28}
              height={28}
              icon="solar:star-fall-line-duotone"
              className="text-primary relative"
            />
          </div>
          <div className="text-sm text-default-400">Analyzing...</div>
        </div>
      )}
    </div>
  );
}
