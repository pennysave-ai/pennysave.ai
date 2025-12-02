export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Copy invite token to clipboard
              navigator.clipboard.writeText('${token}').catch(() => {
                const textArea = document.createElement("textarea");
                textArea.value = '${token}';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
              });
              
              // Redirect to App Store after 1 second
              setTimeout(() => {
                window.location.replace('https://apps.apple.com/app/pennysave/id${process.env.NEXT_PUBLIC_APP_STORE_ID || ""}');
              }, 1000);
            `,
          }}
        />
      </head>
      <body>
        {/* Fallback content (rarely seen - redirect is instant) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            textAlign: "center",
            padding: "20px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>
              Redirecting to App Store...
            </h1>
            <p style={{ fontSize: "14px", opacity: 0.8 }}>
              If you&apos;re not redirected,{" "}
              <a
                href={`https://apps.apple.com/app/pennysave/id${process.env.NEXT_PUBLIC_APP_STORE_ID}`}
                style={{ color: "white", textDecoration: "underline" }}
              >
                click here
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
