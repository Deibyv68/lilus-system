import Image from "next/image";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted/30">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/brand/lilus-logo.png"
            alt="LILUS"
            width={88}
            height={88}
            priority
            className="rounded-full"
          />
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight">LILUS</h1>
            <p className="text-xs italic text-muted-foreground">
              Ilumina tu belleza
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
