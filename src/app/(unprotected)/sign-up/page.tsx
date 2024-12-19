import { Suspense } from "react";
import { Card, CardHeader } from "@nextui-org/card";
import { Link } from "@nextui-org/link";

import SignUpForm from "@/components/sign-up-form";
import { OauthButtons } from "@/components/common";

export default async function SignUp() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Card className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <CardHeader className="pb-2 text-xl font-medium">Sign Up</CardHeader>
        <Suspense fallback={<div>Loading...</div>}>
          <SignUpForm />
        </Suspense>
        <OauthButtons />
        <p className="text-center text-small">
          <span className="mr-1">Already have an account?</span>
          <Link href="/" size="sm">
            Sign In
          </Link>
        </p>
      </Card>
    </div>
  );
}
