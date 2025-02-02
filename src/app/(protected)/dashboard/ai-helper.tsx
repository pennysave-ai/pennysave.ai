import { useState } from "react";

import { Icon } from "@iconify/react";
import { useChat } from "ai/react";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { ScrollShadow } from "@heroui/scroll-shadow";
import PromptArea from "./prompt-area";
import Conversation from "./conversation";
import { useEffect } from "react";

interface AIHelperProps {
  onClose: () => void;
}

export default function AIHelper({ onClose }: AIHelperProps) {
  const [responseStarted, setResponseStarted] = useState(false);
  const handleChatScroll = () => {
    const chat = document.querySelector("#chat-wrapper");
    chat?.scrollTo({
      top: chat.scrollHeight,
      behavior: "smooth",
    });
  };
  const { messages, isLoading, input, handleSubmit, handleInputChange } =
    useChat({
      onResponse: () => {
        setResponseStarted(true);
      },
      onFinish: handleChatScroll,
    });
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
    setResponseStarted(false);
  };

  useEffect(() => {
    if (isLoading) {
      handleChatScroll();
    }
  }, [isLoading]);

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <div className="text-md flex gap-x-2">
          <Icon icon="solar:star-fall-line-duotone" width={22} height={22} />
          <div>Your personal AI Advisor</div>
        </div>
        <Button
          isIconOnly
          size="sm"
          className="p-2"
          variant="light"
          onPress={onClose}
        >
          _
        </Button>
      </CardHeader>
      <Divider />
      <CardBody>
        <div className="relative flex h-full flex-col">
          <ScrollShadow
            className="flex h-[30vh] flex-col gap-6 overflow-y-auto pb-8"
            id="chat-wrapper"
          >
            <Conversation
              messages={messages}
              isLoading={isLoading && !responseStarted}
            />
          </ScrollShadow>
          <div className="mt-auto flex max-w-full flex-col gap-2">
            <PromptArea
              input={input}
              handleSubmit={handleFormSubmit}
              handleInputChange={handleInputChange}
            />
            <p className="px-2 text-tiny text-default-400">
              AI can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
