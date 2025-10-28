"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { useSession } from "@/lib/auth-client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import {
  ChartNoAxesCombined,
  Lock,
  Logs,
  Plug,
  Wallet,
} from "@workspace/ui/icons";
import Image from "next/image";
import Link from "next/link";
import { NavUser } from "./nav-user";

const navData = {
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: ChartNoAxesCombined,
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
  const mobile = useIsMobile();
  const { open } = useSidebar();
  return (
    <Sidebar defaultChecked variant="sidebar" collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 my-1.5 ">
          <SidebarMenu className="flex-1 ">
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:!p-1.5 hover:bg-primary/5 "
              >
                <Link href="/" className="h-14 ">
                  <span className=" font-medium">stream</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarHeader>
      <SidebarContent>
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
