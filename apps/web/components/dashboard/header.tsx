"use client";

import { signOut } from "@/lib/auth-client";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import { BookOpen, LogOut, Plus, Settings, Wallet } from "@workspace/ui/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function DashboardHeader() {
  const router = useRouter();
  const mobile = useIsMobile();

  const { data: headerData, isLoading: headerloading } = useSWR(
    "/api/header",
    fetcher,
    { revalidateOnFocus: true },
  );

  const effectiveUser = headerData;

  const walletBalance = headerData?.balanceCredits ?? 0;

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
      },
    });
  };

  const isLowBalance = walletBalance < 600;

  const adminUrl = "http://localhost:3000/admin";

  const showSkeleton = headerloading;

  return (
    <header className="z-30 lg:w-full bg-white border-b">
      {showSkeleton ? (
        <div className="flex h-16 items-center py-0 px-6 pl-1">
          {/* Left: sidebar trigger placeholder (only shown on mobile in real UI) */}
          {mobile && <Skeleton className="h-8 w-8 rounded-md" />}

          {/* Right: controls placeholder */}
          <div className="flex ml-auto items-center space-x-2 md:space-x-4">
            {/* Wallet chip (mobile) */}
            <div className="md:hidden">
              <Skeleton className="h-6 w-20 rounded-md" />
            </div>
            {/* Wallet chip (desktop) */}
            <div className="hidden md:block">
              <Skeleton className="h-8 w-36 rounded-lg" />
            </div>
            {/* Add credits buttons */}
            {/* <Skeleton className="md:hidden h-8 w-8 rounded-md" /> */}
            <Skeleton className="hidden md:block h-8 w-28 rounded-md" />
            {/* Docs buttons */}
            {/* <Skeleton className="hidden md:block h-8 w-16 rounded-md" /> */}
            <Skeleton className="md:hidden h-8 w-8 rounded-md" />
            {/* Avatar/menu */}
            {mobile && <Skeleton className="h-8 w-8 rounded-full" />}
          </div>
        </div>
      ) : (
        <div className="flex h-16 items-center py-0 px-6 pl-1">
          {mobile && (
            <div className="flex px-2">
              <SidebarTrigger />
            </div>
          )}
          <div className="flex ml-auto items-center space-x-2 md:space-x-4">
            <div
              className={`md:hidden flex items-center space-x-1 px-2 rounded-md ${
                isLowBalance
                  ? "bg-orange-100 dark:bg-orange-900/30"
                  : "bg-muted/50"
              }`}
            >
              <Wallet className="h-3 w-3 text-muted-foreground" />
              <span
                className={`text-xs font-medium ${isLowBalance ? "text-orange-700 dark:text-orange-300" : ""}`}
              >
                {walletBalance.toLocaleString()}
              </span>
            </div>

            <div
              className={`hidden  md:flex items-center space-x-2 group px-1.5  rounded-lg ${
                isLowBalance
                  ? "bg-orange-100 dark:bg-orange-900/30"
                  : "bg-gradient-to-br from-blue-700 via-blue-900 to-black/5 border border-blue-900  "
              }`}
            >
              <span
                className={`text-xl  ${isLowBalance ? "text-orange-700 dark:text-orange-300" : "text-foreground"}`}
              >
                <span className="font-semibold">
                  {walletBalance.toLocaleString()}
                </span>
                {/* <span className="text-sm ml-1.5">c</span> */}
              </span>
            </div>

            {effectiveUser?.role === "admin" && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="hidden md:flex"
              >
                <Link href={adminUrl} target="_blank" rel="noopener noreferrer">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Link>
              </Button>
            )}

            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden md:flex"
            >
              <Link
                className="items-center flex"
                href="https://docs.forgerouter.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BookOpen className="h-4 w-4 mr-1" />
                Docs
              </Link>
            </Button>

            <Button asChild variant="ghost" size="sm" className="md:hidden">
              <Link
                href="https://docs.forgerouter.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BookOpen className="h-3 w-3" />
              </Link>
            </Button>

            {mobile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={effectiveUser?.image ?? undefined}
                        alt={effectiveUser?.name || "User"}
                      />
                      <AvatarFallback>
                        {effectiveUser?.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {effectiveUser?.name || "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {effectiveUser?.email || "user@example.com"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
