import { Header } from "@/components/common";
import { navItems } from "@/routes";
import { auth } from "@/auth";

export default async function ProtectedRoadsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <div className="flex flex-col h-screen">
      <Header
        navItems={navItems.filter(({ protectedPath }) => protectedPath)}
        user={session?.user}
      />
      <main className="flex-grow flex">{children}</main>
      <footer></footer>
    </div>
  );
}
