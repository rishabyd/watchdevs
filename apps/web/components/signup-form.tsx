"use client";
import { signIn, signUp } from "@/lib/auth-client";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { CheckCircle, Mail } from "@workspace/ui/icons";
import { cn } from "@workspace/ui/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const form = e.currentTarget;
      const name =
        (form.elements.namedItem("name") as HTMLInputElement)?.value || "";
      const email =
        (form.elements.namedItem("email") as HTMLInputElement)?.value || "";
      const password =
        (form.elements.namedItem("password") as HTMLInputElement)?.value || "";

      if (!email || !password || !name) return;

      // Use Better Auth signUp function
      const result = await signUp.email({
        email,
        password,
        name,
      });

      if (result?.error) {
        setError(result.error.message || "Signup failed");
      } else {
        // Show verification message instead of redirecting immediately
        setUserEmail(email);
        setShowVerificationMessage(true);
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError("An error occurred during signup");
    } finally {
      setIsLoading(false);
    }
  }

  const handleContinueToLogin = () => {
    router.push("/sign-in");
  };

  // Show email verification message after successful signup
  if (showVerificationMessage) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <CheckCircle className="size-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold">Account Created Successfully!</h2>
          <p className="text-muted-foreground">
            We've sent a verification email to your email address.
          </p>
        </div>

        <Alert>
          <Mail className="size-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Verification email sent to:</p>
              <p className="font-mono text-sm">{userEmail}</p>
              <p className="text-sm">
                Please check your email and click the verification link to
                activate your account.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">Next steps:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Check your email inbox (and spam folder)</li>
            <li>Click the verification link in the email</li>
            <li>Return here to sign in to your account</li>
          </ul>
        </div>

        <Button onClick={handleContinueToLogin} className="w-full">
          Continue to Sign In
        </Button>
      </div>
    );
  }

  async function handleGoogleSignUp() {
    setIsLoading(true);
    setError("");
    try {
      await signIn.social({
        provider: "github",
        callbackURL: "/",
      });
    } catch (error) {
      console.error("Google sign-up error:", error);
      setError("Google sign-up failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      {...props}
      onSubmit={onSubmit}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your details below to create your account
        </p>
      </div>
      <div className="grid gap-6">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}
        <div className="grid gap-3">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Jane Doe"
            required
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            required
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            disabled={isLoading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Or continue with
          </span>
        </div>
        <Button
          variant="outline"
          className="w-full"
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isLoading}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              fill="currentColor"
            />
          </svg>
          {isLoading ? "Signing up..." : "Continue with Google"}
        </Button>
      </div>
      <div className="text-center text-sm">
        Already have an account?{" "}
        <a href="/sign-in" className="underline underline-offset-4">
          Sign in
        </a>
      </div>
    </form>
  );
}
