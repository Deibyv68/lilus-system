import Link from "next/link";

export function MobileHeader() {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b">
      <div className="px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <h1 className="text-xl font-black tracking-tight">LILUS</h1>
          <span className="text-[10px] italic text-muted-foreground">
            Ilumina tu belleza
          </span>
        </Link>
      </div>
    </header>
  );
}
