import ResetPasswordForm from "@/components/reset-password-form";
import { Card, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { AuthCardFooter } from "@/components/common";

export default async function ResetPassword() {
  return (
    <div className="flex flex-col h-full w-full items-center justify-center">
      <div className="relative w-full max-w-[800px]">
        <div className="blur-background blur-1 top-[-300px] left-[-280px]" />
      </div>
      <Card className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <CardHeader className="pb-2 text-xl font-medium">
          Reset your password
        </CardHeader>
        <div className="text-sm">
          Please enter your email to reset your password
        </div>
        <ResetPasswordForm />
        <div className="flex items-center gap-4 py-2">
          <Divider className="flex-1" />
          <p className="shrink-0 text-tiny text-default-500">OR</p>
          <Divider className="flex-1" />
        </div>
        <AuthCardFooter title="Back to" text="Sign In" link="/auth/sign-in" />
      </Card>
    </div>
  );
}
