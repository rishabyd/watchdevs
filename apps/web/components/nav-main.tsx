"use client";

import { type LucideIcon } from "@workspace/ui/icons";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
}) {
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex  flex-col ">
        <SidebarMenu className="gap-2">
          {items.map((item) => {
            const isActive =
              pathname === item.url ||
              (item.url !== "/" && pathname?.startsWith(item.url));
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  data-active={isActive ? "true" : undefined}
                  className={
                    isActive
                      ? " data-[slot=sidebar-menu-button]:bg-primary/10 data-[slot=sidebar-menu-button]:text-primary"
                      : "text-muted-foreground"
                  }
                >
                  <Link
                    className="px-3 rounded-none transition-all duration-300 p-5"
                    href={item.url as any}
                  >
                    <div className="text-center scale-75 ">
                      {item.icon && <item.icon />}
                    </div>
                    <div>{item.title}</div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
