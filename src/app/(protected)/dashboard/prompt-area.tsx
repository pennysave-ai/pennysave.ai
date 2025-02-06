"use client";
import { ChangeEventHandler } from "react";

import { Button } from "@heroui/button";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Icon } from "@iconify/react";
import { Tooltip } from "@heroui/tooltip";
import { cn } from "@heroui/theme";
import PromptInput from "./prompt-input";
import { USER_INPUT_LIMIT } from "@/constants";

interface PromptAreaProps {
  input: string;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleInputChange: ChangeEventHandler<HTMLInputElement>;
  disabled: boolean;
}

export default function PromptArea({
  input,
  handleSubmit,
  handleInputChange,
  disabled,
}: PromptAreaProps) {
  const prompts = [
    {
      title: "What are my main spending patterns?",
      description: "Help me to understand my spending habits.",
    },
    {
      title: "Identify my unnecessary expenses",
      description:
        "Find unneeded recurring subscriptions or transactions that might be avoided.",
    },
    {
      title: "What is my current financial status",
      description: "Explain my current financial situation",
    },
  ];

  const handlePromptClick = (promptIndex: number) => {
    const form = document.querySelector("#prompt-submit-form");
    if (form) {
      const prompt = prompts[promptIndex];
      handleInputChange({
        target: {
          value: `${prompt.title} ${prompt.description}`,
        } as EventTarget & HTMLInputElement,
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };
  return (
    <div className="flex w-full flex-col gap-4">
      <ScrollShadow
        hideScrollBar
        className="flex flex-nowrap gap-2"
        orientation="horizontal"
      >
        <div className="flex gap-2">
          {prompts.map(({ title, description }, index) => (
            <Button
              key={index}
              className="flex h-14 flex-col items-start gap-0"
              variant="flat"
              onPress={() => handlePromptClick(index)}
            >
              <p>{title}</p>
              <p className="text-default-500">{description}</p>
            </Button>
          ))}
        </div>
      </ScrollShadow>
      <form
        id="prompt-submit-form"
        className="flex w-full flex-col items-start rounded-medium bg-default-100 transition-colors hover:bg-default-200/70"
        onSubmit={handleSubmit}
      >
        <PromptInput
          classNames={{
            inputWrapper: "!bg-transparent shadow-none",
            innerWrapper: "relative",
            input: "pt-1 pl-2 pb-6 !pr-10 text-medium",
          }}
          endContent={
            <div className="flex items-end gap-2">
              <Tooltip showArrow content="Send message">
                <Button
                  isIconOnly
                  color={!input ? "default" : "primary"}
                  isDisabled={!input || disabled}
                  radius="lg"
                  size="sm"
                  variant="solid"
                  type="submit"
                >
                  <Icon
                    className={cn(
                      "[&>path]:stroke-[2px]",
                      !input ? "text-default-600" : "text-primary-foreground"
                    )}
                    icon="solar:arrow-up-linear"
                    width={20}
                  />
                </Button>
              </Tooltip>
            </div>
          }
          minRows={3}
          radius="lg"
          value={input}
          variant="flat"
          onChange={handleInputChange}
          onKeyUp={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (input) {
                const form = e.currentTarget.closest("form");
                if (form) {
                  const submitEvent = new Event("submit", {
                    bubbles: true,
                    cancelable: true,
                  });
                  form.dispatchEvent(submitEvent);
                }
              }
            }
          }}
        />
        <div className="flex w-full items-center justify-between  gap-2 overflow-scroll px-4 pb-4">
          <div className="flex flex-wrap gap-3">
            {/* <Button
              size="sm"
              startContent={
                <Icon
                  className="text-default-500"
                  icon="solar:paperclip-linear"
                  width={18}
                />
              }
              variant="flat"
            >
              Add Transaction
            </Button> */}
          </div>
          <p className="py-1 text-tiny text-default-400">
            {input.length}/{USER_INPUT_LIMIT}
          </p>
        </div>
      </form>
    </div>
  );
}
