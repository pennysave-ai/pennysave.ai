"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@heroui/button";

interface SubmitButtonProps {
  children: React.ReactNode;
  className?: string;
}

export function SubmitButton({ children, className = "" }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      color="primary"
      disabled={pending}
      isLoading={pending}
      className={className}
    >
      {children}
    </Button>
  );
}
