import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="flex  bg-background/50 backdrop-blur-lg items-center gap-2 border-b  w-screen h-14  ease-linear ">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Stream</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <Link href={`/studio`}>Upload video</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
