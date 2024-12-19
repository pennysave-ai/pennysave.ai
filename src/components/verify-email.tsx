"use client";
import { useCallback, useEffect, useState } from "react";
import { Spinner } from "@nextui-org/spinner";
import { useSearchParams } from "next/navigation";
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
    actions
      .verifyEmail(token)
      .then((data) => {
        setSuccess(data?.success?._form?.join(", "));
        setError(data?.errors?._form?.join(", "));
      })
      .catch(() => {
        setError("Something went wrong");
      });
  }, [token]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <>
      {!error && !success && (
        <div className="flex justify-center flex-col items-center">
          <div className="text-sm mb-4">Confirming your verification...</div>
          <Spinner />
        </div>
      )}
      <div className="flex justify-center mt-4 flex-1">
        {error && (
          <div className="w-full text-center rounded-xl text-sm px-3 py-2 bg-red-200 dark:bg-red-800">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl text-sm px-3 py-2 bg-green-400 dark:bg-green-800">
            {success}
          </div>
        )}
      </div>
    </>
  );
}
