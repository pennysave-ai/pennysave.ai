"use client";

import React from "react";
import { useSession } from "next-auth/react";

import { Icon } from "@iconify/react";
import { Avatar } from "@heroui/avatar";
import { Badge } from "@heroui/badge";
import MessageCard from "./message-card";

interface Conversation {
  messages: {
    role: string;
    content: string;
  }[];
  isLoading: boolean;
}

export default function Conversation({ messages, isLoading }: Conversation) {
  const { data } = useSession();
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
          avatar={
            role === "assistant"
              ? "https://nextuipro.nyc3.cdn.digitaloceanspaces.com/components-images/avatar_ai.png"
              : data?.user?.image || ""
          }
          message={content}
          messageClassName={
            role === "user" ? "bg-content3 text-content3-foreground" : ""
          }
          showFeedback={role === "assistant"}
          className={role === "user" ? "flex-row-reverse" : ""}
        />
      ))}
      {isLoading && (
        <div className="flex gap-3 items-center">
          <div>
            <Badge
              isOneChar
              color="danger"
              content={
                <Icon
                  className="text-background"
                  icon="gravity-ui:circle-exclamation-fill"
                />
              }
              placement="bottom-right"
              shape="circle"
            >
              <Avatar src="https://nextuipro.nyc3.cdn.digitaloceanspaces.com/components-images/avatar_ai.png" />
            </Badge>
          </div>
          <div className="text-sm text-default-400">Analyzing...</div>
        </div>
      )}
    </div>
  );
}
