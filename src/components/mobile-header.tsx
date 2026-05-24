import Link from "next/link";
import Image from "next/image";

export function MobileHeader() {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
      <div className="px-4 py-2.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <Image
            src="/brand/lilus-logo.png"
            alt="LILUS"
            width={32}
            height={32}
            priority
            className="rounded-full shrink-0"
          />
          <div className="min-w-0">
            <h1 className="text-lg font-black tracking-tight leading-none">
              LILUS
            </h1>
            <p className="text-[9px] italic text-muted-foreground mt-0.5 leading-none">
              Ilumina tu belleza
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
