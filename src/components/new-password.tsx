"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import * as actions from "@/actions";
import { SubmitButton, PasswordInput } from "@/components/common";

export default function NewPassword() {
  const [formState, action] = useActionState(actions.setNewPassword, {
    errors: {},
    success: {},
  });
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return (
    <>
      <form className="flex flex-col" action={action}>
        <div className="flex flex-col gap-3 mb-6">
          {token && <input type="hidden" name="token" value={token} />}
          <PasswordInput
            name="password"
            label="Password"
            placeholder="Enter your password"
            isInvalid={!!formState?.errors.password}
            errorMessage={formState?.errors.password?.join(", ")}
          />
          <PasswordInput
            name="password2"
            label="Confirm Password"
            placeholder="Confirm your password"
            isInvalid={!!formState?.errors.password2}
            errorMessage={formState?.errors.password2?.join(", ")}
          />
          {formState?.success?._form && (
            <div className="rounded-xl text-sm px-3 py-2 bg-green-400 dark:bg-green-800">
              {formState.success._form.join(", ")}
            </div>
          )}
          {formState?.errors._form && (
            <div className="rounded-xl text-sm px-3 py-2 bg-red-200 dark:bg-red-800">
              {formState.errors._form.join(", ")}
            </div>
          )}
        </div>
        <SubmitButton>Save</SubmitButton>
      </form>
    </>
  );
}
