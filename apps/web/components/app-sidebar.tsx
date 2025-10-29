"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { useSession } from "@/lib/auth-client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@workspace/ui/components/sidebar";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { House, Plug } from "@workspace/ui/icons";
import { NavUser } from "./nav-user";
import { usePathname } from "next/navigation";

const navData = {
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: House,
    },
    {
      title: "You",
      url: "/feed/you",
      icon: Plug,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const a = pathname.includes("/watch");
  return (
    <Sidebar
      defaultChecked
      variant="sidebar"
      collapsible={a ? "offcanvas" : "icon"}
      {...props}
    >
      <SidebarContent className="mt-20">
        <NavMain items={navData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        {!session ? (
          <div className="flex  items-center gap-3 px-2 py-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-28 " />
          </div>
        ) : (
          <NavUser
            user={{
              name: session?.user?.name ?? "",
              email: session?.user?.email ?? "",
              avatar: session?.user?.image ?? "",
            }}
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
