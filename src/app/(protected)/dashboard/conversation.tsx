"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import MessageCard from "./message-card";
import AiAvatar from "./ai-avatar";

interface ConversationProps {
  messages: {
    role: string;
    content: string;
  }[];
  isLoading: boolean;
  isTyping: boolean;
  responseStarted: boolean;
  error?: Error;
  currentTool: string | null;
}

export default function Conversation({
  messages,
  isLoading,
  isTyping,
  responseStarted,
  error,
  currentTool,
}: ConversationProps) {
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
          currentTool={currentTool}
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
          className={role === "user" ? "flex-row-reverse" : ""}
        />
      ))}
      {error && (
        <div className="flex items-center gap-x-2">
          <AiAvatar error />
          <div className="relative w-full rounded-medium bg-content2 px-4 py-3 text-sm text-danger-400">
            An error occurred. - {error.message}
          </div>
        </div>
      )}
      {isLoading && (
        <div className="realtive flex items-center justify-start gap-2">
          <AiAvatar loading />
          <div className="relative rounded-medium bg-content2 px-4 py-3 text-default-600">
            <div className="text-sm text-default-400 thinking-dots">
              Thinking
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
