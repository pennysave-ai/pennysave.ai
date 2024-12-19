import { Header } from "@/components/common";
import { navItems } from "@/routes";

export default async function UnprotectedRoadsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col h-screen">
      <Header
        navItems={navItems.filter(({ protectedPath }) => !protectedPath)}
      />
      <main className="flex-grow flex">{children}</main>
      <footer></footer>
    </div>
  );
}
