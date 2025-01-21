import { HeroUIProvider } from "@heroui/system";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import QueryProvider from "./query-provider";
import { ModalProvider } from "./modal";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <HeroUIProvider>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <QueryProvider>
            <ModalProvider>{children}</ModalProvider>
          </QueryProvider>
        </ThemeProvider>
      </HeroUIProvider>
    </SessionProvider>
  );
}
