"use client";
import { signOut } from "@/lib/auth-client";
import { Button } from "@workspace/ui/components/button";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  async function trigger() {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
        },
      },
    });
  }
  trigger();
  return <Button onClick={trigger}>Sign Out</Button>;
}
