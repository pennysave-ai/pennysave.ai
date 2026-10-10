import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  display: "swap",
});

/** Marketing pages: the landing page and the public legal documents. */
export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={poppins.className}>
      {/* The app's theme provider isn't mounted here, so give the document
          itself the page colour (overscroll and rubber-banding stay dark). */}
      <style>{"html{background:#0e0e24;color-scheme:dark}"}</style>
      {children}
    </div>
  );
}
