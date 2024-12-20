import ResetPasswordForm from "@/components/reset-password-form";
import { Card, CardHeader } from "@nextui-org/card";

export default async function ResetPassword() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Card className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <CardHeader className="pb-2 text-xl font-medium">
          Reset your password
        </CardHeader>
        <div className="text-sm">
          Please enter your email to reset your password
        </div>
        <ResetPasswordForm />
      </Card>
    </div>
  );
}
