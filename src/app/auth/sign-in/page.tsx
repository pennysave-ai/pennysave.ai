import { Suspense } from "react";

import { Card, CardHeader } from "@heroui/card";

import SignInForm from "@/components/sign-in-form";
import { AuthCardFooter, OauthButtons } from "@/components/common";

export default function SignIn() {
  return (
    <div className="flex flex-col h-full w-full items-center justify-center">
      <div className="relative w-full max-w-[800px]">
        <div className="blur-background blur-1 top-[-200px] left-[-280px]" />
      </div>
      <Card className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <CardHeader className="pb-2 text-xl font-medium">Sign In</CardHeader>
        <Suspense fallback={<div>Loading...</div>}>
          <SignInForm />
        </Suspense>
        <OauthButtons />
        <AuthCardFooter
          title="Need to create an account?"
          text="Sign Up"
          link="/auth/sign-up"
        />
      </Card>
    </div>
  );
}
