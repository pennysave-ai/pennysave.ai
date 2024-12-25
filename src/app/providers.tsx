import { NextUIProvider } from "@nextui-org/system";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import QueryProvider from "./query-provider";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <NextUIProvider>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </NextUIProvider>
    </SessionProvider>
  );
}
