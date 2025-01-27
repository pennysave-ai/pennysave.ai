"use client";

import { useCallback, useEffect, useState } from "react";
import { Spinner } from "@heroui/spinner";
import { useSearchParams } from "next/navigation";
import { Button } from "@heroui/button";
import * as actions from "@/actions";

export default function VerifyEmail() {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const onSubmit = useCallback(async () => {
    if (!token) {
      setError("Missing token");
      return;
    }
    try {
      const data = await actions.verifyEmail(token);
      setSuccess(data?.success?._form?.join(", "));
      setError(data?.errors?._form?.join(", "));
    } catch {
      setError("Something went wrong");
    }
  }, [token]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <>
      {!error && !success && (
        <div className="flex justify-center flex-col items-center">
          <div className="text-sm mb-4">Confirming your email...</div>
          <Spinner />
        </div>
      )}
      <div className="flex justify-center mt-0 flex-1">
        {error && (
          <div className="w-full text-center rounded-xl text-sm px-3 py-2 bg-red-200 dark:bg-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="flex flex-col gap-y-3">
            <h1 className="text-center text-success">Congratilations!</h1>
            <div className="text-sm px-3 py-2">{success}</div>
            <Button
              color="primary"
              className="w-full"
              onPress={() => {
                window.location.href = "/";
              }}
            >
              Go back to home page
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
