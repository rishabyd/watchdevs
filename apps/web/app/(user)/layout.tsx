import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { SiteHeader } from "@/components/dashboard/site-header";
import { auth } from "@/lib/auth";
import {
  SidebarInset,
  SidebarProvider,
} from "@workspace/ui/components/sidebar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <div className="z-10 fixed">
        <SiteHeader />
      </div>
      <SidebarInset>
        <main className="flex-1 pt-14  overflow-y-auto ">
          <div className="max-w-7xl  mx-auto">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
