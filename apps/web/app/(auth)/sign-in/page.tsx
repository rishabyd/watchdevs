import { LoginForm } from "@/components/login-form";
import Image from "next/image";
import { Suspense } from "react";

export default async function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="relative size-6 sm:size-[45px] rounded-md">
            <Image
              src="/logo-icon.png"
              alt="ForgeRouter Logo"
              fill
              priority
              className="object-contain"
            />
          </div>
          <span>Forge Router</span>
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
