import { Suspense } from "react";
import { Card, CardHeader } from "@nextui-org/card";
import VerifyEmail from "@/components/verify-email";

export default async function VerifyEmailPage() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Card className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <CardHeader className="pb-2 text-xl font-medium">
          Verify Email
        </CardHeader>
        <Suspense>
          <VerifyEmail />
        </Suspense>
      </Card>
    </div>
  );
}
