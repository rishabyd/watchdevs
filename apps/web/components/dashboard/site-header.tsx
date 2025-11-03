"use client";
import { Button } from "@workspace/ui/components/button";
import { useSidebar } from "@workspace/ui/components/sidebar";
import { Menu, Plus } from "@workspace/ui/icons";
import Link from "next/link";
import SearchBar from "../search/search-bar";

export function SiteHeader() {
  const { toggleSidebar } = useSidebar();
  return (
    <header className="flex  bg-background/80 backdrop-blur-lg items-center gap-2   w-screen h-14 pr-7 ease-linear ">
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
        <div className=" mx-auto">
          <SearchBar />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            asChild
            size="sm"
            className="hidden sm:flex"
          >
            <Link className="flex" href={`/studio`}>
              <div>
                <Plus />
              </div>
              <div>Create</div>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
