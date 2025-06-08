import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";

import { Google, Apple, Github } from "@/app/icons";
import * as actions from "@/actions";

export function OauthButtons({ title }: { title?: string }) {
  return (
    <>
      <div className="flex items-center gap-4 py-2">
        <Divider className="flex-1" />
        <p className="shrink-0 text-tiny text-default-500">{title}</p>
        <Divider className="flex-1" />
      </div>
      <div className="flex flex-col gap-2">
        <form action={actions.googleSignIn}>
          <Button
            type="submit"
            size="lg"
            startContent={<Google />}
            variant="bordered"
            className="w-full"
          >
            Google
          </Button>
        </form>
        <form action={actions.appleSignIn}>
          <Button
            type="submit"
            size="lg"
            startContent={<Apple />}
            variant="bordered"
            className="w-full"
          >
            Apple
          </Button>
        </form>
        <form action={actions.githubSignIn}>
          <Button
            type="submit"
            size="lg"
            startContent={<Github />}
            variant="bordered"
            className="w-full"
          >
            Github
          </Button>
        </form>
      </div>
    </>
  );
}
