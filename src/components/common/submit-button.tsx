"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@heroui/button";

interface SubmitButtonProps {
  children: React.ReactNode;
  className?: string;
  isDisabled?: boolean;
}

export function SubmitButton({
  children,
  className = "",
  isDisabled = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      color="primary"
      isDisabled={pending || isDisabled}
      isLoading={pending}
      className={className}
    >
      {children}
    </Button>
  );
}
