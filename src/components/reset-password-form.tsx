"use client";

import { useActionState } from "react";
import { Input } from "@heroui/input";
import * as actions from "@/actions";
import { SubmitButton } from "@/components/common";

export default function ResetPasswordForm() {
  const [formState, action] = useActionState(actions.resetPassword, {
    errors: {},
    success: {},
  });

  const showErrorMessage = () => {
    if (formState?.success?._form) {
      return (
        <div className="rounded-xl text-sm px-3 py-2 bg-green-400 dark:bg-green-800">
          {formState?.success._form?.join(", ")}
        </div>
      );
    }
    if (formState?.errors._form) {
      return (
        <div className="rounded-xl text-sm px-3 py-2 bg-red-200 dark:bg-red-800">
          {formState?.errors?._form.join(", ")}
        </div>
      );
    }
    return null;
  };

  return (
    <form className="flex flex-col gap-3" action={action}>
      <Input
        label="Email Address"
        name="email"
        placeholder="Enter your email"
        type="text"
        variant="bordered"
        validationBehavior="aria"
        isInvalid={!!formState?.errors?.email}
        errorMessage={formState?.errors?.email?.join(", ")}
        className="mb-4"
      />
      {showErrorMessage()}
      <SubmitButton>Reset my password</SubmitButton>
    </form>
  );
}
