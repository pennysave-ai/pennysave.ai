import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center px-6">
      <div className="text-center text-6xl max-w-4xl font-semibold leading-snug">
        Take{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
          Control
        </span>{" "}
        of Your{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
          Finances
        </span>{" "}
        with Ease!
      </div>
      <div className="text-lg text-default-500 text-center">
        A convenient tool for managing your finances.
      </div>
      <div className="flex gap-4 mt-8">
        <Button
          color="primary"
          variant="flat"
          size="lg"
          className="rounded-full"
          onPress={() => {
            router.push("/auth/sign-up");
          }}
        >
          Register Now
        </Button>
        <Button
          color="primary"
          variant="solid"
          size="lg"
          className="rounded-full"
          onPress={() => {
            router.push("/auth/sign-in");
          }}
        >
          Sign in
        </Button>
      </div>
    </div>
  );
}
