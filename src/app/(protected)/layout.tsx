import { Header } from "@/components/common";
import Sidebar from "@/components/sidebar";
import { auth } from "@/auth";
import { PaywallModal } from "@/components/common/paywall-modal";
import WebSocketClient from "./websocket-client";

export default async function ProtectedRoadsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <div className="flex flex-col h-screen">
      <Header user={session?.user} />
      <main className="flex-grow flex">
        <Sidebar user={session?.user || null} />
        {children}
        <PaywallModal />
        <WebSocketClient userId={session?.user?.id || null} />
      </main>
      <footer></footer>
    </div>
  );
}
