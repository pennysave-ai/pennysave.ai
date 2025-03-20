import { ToastProvider } from "@heroui/toast";
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
          <ToastProvider
            toastProps={{
              timeout: 5000,
              shouldShowTimeoutProgress: true,
              variant: "bordered",
            }}
          />
          <QueryProvider>
            <ModalProvider>{children}</ModalProvider>
          </QueryProvider>
        </ThemeProvider>
      </HeroUIProvider>
    </SessionProvider>
  );
}
