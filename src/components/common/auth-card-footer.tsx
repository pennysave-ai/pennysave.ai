"use client";
import { Link } from "@heroui/link";
import { useRouter } from "next/navigation";

interface AuthCardFooter {
  title: string;
  text: string;
  link: string;
}

export const AuthCardFooter = ({ title, text, link }: AuthCardFooter) => {
  const router = useRouter();
  return (
    <p className="text-center text-small">
      <span className="mr-1">{title}</span>
      <Link
        className="cursor-pointer"
        size="sm"
        onPress={() => {
          router.push(link);
        }}
      >
        {text}
      </Link>
    </p>
  );
};
