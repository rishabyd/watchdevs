"use client";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { useSidebar } from "@workspace/ui/components/sidebar";
import { Menu } from "@workspace/ui/icons";
import Link from "next/link";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  return (
    <header className="flex  bg-background/50 backdrop-blur-lg items-center gap-2   w-screen h-14  ease-linear ">
      <div className="flex w-full h-full items-center gap-1 px-4 lg:gap-2 lg:px-2">
        <Button
          variant={"link"}
          className="flex justify-center hover:scale-105 items-center"
          onClick={() => toggleSidebar()}
        >
          <Menu className="size-7 " />
        </Button>

        <Link className="h-full flex items-center" href={`/`}>
          <h1 className="font-sans text-xl font-medium">WatchDevs</h1>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <Link href={`/studio`}>Upload video</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
