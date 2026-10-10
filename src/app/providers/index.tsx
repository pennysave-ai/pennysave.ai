import { preconnect } from "react-dom";
import { ToastProvider } from "@heroui/toast";
import { HeroUIProvider } from "@heroui/system";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import QueryProvider from "./query-provider";
import { ModalProvider } from "./modal";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Everything the app (dashboard, auth, settings) needs. The marketing pages in
 * (landing) don't use any of it, so each app route group mounts this in its own
 * layout instead of the root layout wrapping every page.
 */
export default function Providers({ children }: ProvidersProps) {
  // Icons in the app load from Iconify; warm the connection.
  preconnect("https://api.iconify.design", { crossOrigin: "anonymous" });
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
