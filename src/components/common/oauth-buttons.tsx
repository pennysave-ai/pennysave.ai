import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";

import { Google, Apple, Github, X } from "@/app/icons";
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
        <div className="flex justify-evenly">
          <form action={actions.xSignIn}>
            <Button type="submit" isIconOnly aria-label="Like" radius="full">
              <X />
            </Button>
          </form>
          <form action={actions.googleSignIn}>
            <Button type="submit" isIconOnly aria-label="Like" radius="full">
              <Google />
            </Button>
          </form>
          <form action={actions.appleSignIn}>
            <Button type="submit" isIconOnly aria-label="Like" radius="full">
              <Apple />
            </Button>
          </form>
          <form action={actions.githubSignIn}>
            <Button type="submit" isIconOnly aria-label="Like" radius="full">
              <Github />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
