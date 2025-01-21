"use client";

import { useFormState } from "react-dom";
import { Input } from "@heroui/input";
import { Checkbox } from "@heroui/checkbox";
import { Link } from "@heroui/link";
import { useSearchParams } from "next/navigation";

import * as actions from "@/actions";
import { SubmitButton, PasswordInput } from "@/components/common";

export default function SignInForm() {
  const [formState, action] = useFormState(actions.emailSignIn, {
    errors: {},
    success: {},
  });
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error") === "OAuthAccountNotLinked";

  const showErrorMessage = () => {
    if (!!formState?.errors.email || !!formState?.errors.password) {
      return null;
    }
    if (formState?.errors._form) {
      return (
        <div className="rounded-xl text-sm px-3 py-2 bg-red-200 dark:bg-red-800">
          {formState?.errors?._form.join(", ")}
        </div>
      );
    }
    if (formState?.success?._form) {
      return (
        <div className="rounded-xl text-sm px-3 py-2 bg-green-400 dark:bg-green-800">
          {formState?.success._form?.join(", ")}
        </div>
      );
    }
    if (urlError) {
      return (
        <div className="rounded-xl text-sm px-3 py-2 bg-red-200 dark:bg-red-800">
          This email is already in use with different provider
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
        isInvalid={!!formState?.errors.email}
        errorMessage={formState?.errors.email?.join(", ")}
      />
      <PasswordInput
        name="password"
        label="Password"
        placeholder="Enter your password"
        isInvalid={!!formState?.errors?.password}
        errorMessage={formState?.errors?.password?.join(", ")}
      />
      {showErrorMessage()}
      <div className="flex items-center justify-between px-1 py-2">
        <Checkbox name="remember" size="sm" isDisabled>
          Remember me
        </Checkbox>
        <Link size="sm" href="/auth/reset-password">
          Forgot password?
        </Link>
      </div>
      <SubmitButton>Sign In</SubmitButton>
    </form>
  );
}
