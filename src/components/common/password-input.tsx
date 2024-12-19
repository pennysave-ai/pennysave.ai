"use client";

import { useState } from "react";
import { Input } from "@nextui-org/input";
import { EyeOpen, EyeClosed } from "@/app/icons";

interface PasswordInputProps {
  name: string;
  label: string;
  placeholder: string;
  isInvalid?: boolean;
  errorMessage?: string;
}

export function PasswordInput({
  name,
  label,
  placeholder,
  isInvalid,
  errorMessage,
}: PasswordInputProps): React.ReactElement {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  return (
    <Input
      label={label}
      name={name}
      placeholder={placeholder}
      isInvalid={isInvalid}
      errorMessage={errorMessage}
      variant="bordered"
      validationBehavior="aria"
      type={isVisible ? "text" : "password"}
      endContent={
        <button
          type="button"
          onClick={toggleVisibility}
          aria-label="toggle password visibility"
        >
          {isVisible ? <EyeClosed /> : <EyeOpen />}
        </button>
      }
    />
  );
}
