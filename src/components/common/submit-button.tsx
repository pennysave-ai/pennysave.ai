"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@nextui-org/button";

interface SubmitButtonProps {
  children: React.ReactNode;
}

export function SubmitButton({ children }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      color="primary"
      disabled={pending}
      isLoading={pending}
    >
      {children}
    </Button>
  );
}
