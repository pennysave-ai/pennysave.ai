"use client";

import { useFormState } from "react-dom";
import { Input } from "@heroui/input";
import TermsAndPrivacyPolicy from "@/components/terms-and-privacy-policy";

import * as actions from "@/actions";
import { SubmitButton, PasswordInput } from "@/components/common";

export default function SignUpForm() {
  const [formState, action] = useFormState(actions.signUp, {
    errors: {},
    success: {},
  });
  return (
    <form className="flex flex-col gap-3" action={action}>
      <Input
        label="Username"
        name="username"
        placeholder="Enter your username"
        type="text"
        variant="bordered"
        validationBehavior="aria"
        isInvalid={!!formState?.errors.username}
        errorMessage={formState?.errors.username?.join(", ")}
      />
      <Input
        label="Email Address"
        name="email"
        placeholder="Enter your email"
        type="text"
        variant="bordered"
        validationBehavior="aria"
        isInvalid={!!formState?.errors.email}
        errorMessage={formState?.errors.email?.join(", ")}
      />
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
      <TermsAndPrivacyPolicy />
      <SubmitButton>Sign Up</SubmitButton>
    </form>
  );
}
