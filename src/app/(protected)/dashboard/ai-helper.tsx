// import { useState, useEffect } from "react";
// import { useSession } from "next-auth/react";
// import { useChat } from "ai/react";

import { Icon } from "@iconify/react";
// import { useModal } from "@/app/providers/modal";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { ScrollShadow } from "@heroui/scroll-shadow";
// import PromptArea from "./prompt-area";
// import Conversation from "./conversation";
// import { USER_INPUT_LIMIT } from "@/constants";

interface AIHelperProps {
  onClose: () => void;
}

export default function AIHelper({ onClose }: AIHelperProps) {
  // const [responseStarted, setResponseStarted] = useState(false);
  // const [currentTool, setCurrentTool] = useState<string | null>(null);
  // const { data } = useSession();
  // const { onOpen: onPaywallModalOpen } = useModal();
  // const handleChatScroll = () => {
  //   const chat = document.querySelector("#chat-wrapper");
  //   chat?.scrollTo({
  //     top: chat.scrollHeight,
  //     behavior: "smooth",
  //   });
  // };
  // const { messages, isLoading, input, handleSubmit, setInput, error } = useChat(
  //   {
  //     onResponse: () => {
  //       setResponseStarted(true);
  //     },
  //     onFinish: () => {
  //       setResponseStarted(false);
  //       setCurrentTool(null);
  //       handleChatScroll();
  //     },
  //     onToolCall: ({ toolCall }) => {
  //       setCurrentTool(toolCall.toolName);
  //     },
  //   }
  // );

  // const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   if (data?.user.hasActiveStripeSubscription) {
  //     handleSubmit(e);
  //     setResponseStarted(false);
  //   } else {
  //     onPaywallModalOpen();
  //   }
  // };

  // useEffect(() => {
  //   if (isLoading) {
  //     handleChatScroll();
  //   }
  // }, [isLoading]);

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <div className="text-md flex gap-x-2">
          <Icon
            className="text-primary"
            icon="solar:star-fall-line-duotone"
            width={22}
            height={22}
          />
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
            {/* <Conversation
              messages={messages}
              isLoading={isLoading && !responseStarted}
              responseStarted={responseStarted}
              isTyping={responseStarted}
              error={error}
              currentTool={currentTool}
            /> */}
          </ScrollShadow>
          <div className="mt-auto flex max-w-full flex-col gap-2">
            {/* <PromptArea
              disabled={isLoading}
              input={input}
              handleSubmit={handleFormSubmit}
              handleInputChange={(e) => {
                if (e.target.value.length <= USER_INPUT_LIMIT) {
                  setInput(e.target.value);
                }
              }}
            /> */}
            <p className="px-2 text-tiny text-default-400">
              AI can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
