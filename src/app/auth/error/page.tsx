import { Card, CardHeader } from "@nextui-org/card";
import { Button } from "@nextui-org/button";
import { Link } from "@nextui-org/link";

export default async function AuthErrorPage() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Card className="flex w-full max-w-sm flex-col gap-4 rounded-large bg-content1 px-8 pb-10 pt-6 shadow-small">
        <CardHeader className="pb-2 text-xl font-medium">Error</CardHeader>
        <p className="text-center text-sm text-danger">
          It seems that an error occurred while trying to authenticate.
        </p>
        <Button
          as={Link}
          variant="solid"
          color="primary"
          href="/"
          className="mt-2"
        >
          Go Back
        </Button>
      </Card>
    </div>
  );
}
