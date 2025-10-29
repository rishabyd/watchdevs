import { AnimatedCounter } from "@/components/payment/animated-counter";
import { dodoPayments } from "@/lib/auth";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { AlertTriangle, ArrowRight, Check } from "@workspace/ui/icons";
import Image from "next/image";
import Link from "next/link";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_id?: string }>;
}) {
  const params = await searchParams;
  const paymentId = params.payment_id;

  if (!paymentId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-4">
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-6">
            <div className="text-center text-destructive font-medium">
              Error: No payment ID provided.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  let payment;
  try {
    payment = await dodoPayments.payments.retrieve(paymentId);
  } catch (error) {
    console.error("Failed to retrieve payment details:", error);
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-4">
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-6">
            <div className="text-center text-destructive font-medium">
              Error: Could not retrieve purchase details.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (payment.status !== "succeeded") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-2xl overflow-auto bg-gradient-to-br from-red-600/20  via-background to-red-600/20 p-4 ">
        <div className="w-full max-w-md">
          <Card className="border-destructive/50 shadow-2xl backdrop-blur-sm bg-card">
            <CardContent className="p-8 pb-3">
              {/* Failed Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg">
                    <AlertTriangle className="h-8 w-8 text-white stroke-[3]" />
                  </div>
                </div>
              </div>

              {/* Heading */}
              <div className="text-center space-y-2 mb-8">
                <h1 className="text-2xl font-semibold text-foreground">
                  Payment Failed
                </h1>
                <p className="text-sm text-muted-foreground">
                  We couldn’t process your payment. Please try again or contact
                  support if the issue persists.
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <Button
                  asChild
                  size="default"
                  className="w-full font-medium group"
                  variant="destructive" // Optional: Use destructive variant for "Try Again" to emphasize retry
                >
                  <Link href="/billing">
                    Try Again
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="default"
                  className="w-full font-medium group"
                  variant="outline"
                >
                  <Link href="/">
                    Back to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>

              {/* Footer */}
              <div className="mt-12 text-center">
                <p className="text-xs text-muted-foreground">
                  We're here to help with your AI routing needs
                </p>
                <div className="flex mt-2.5 gap-1.5 items-center justify-center">
                  <Image
                    width={200}
                    height={200}
                    src="/logo-icon.png"
                    alt="ForgeRouter Logo"
                    className="sm:size-[40px] size-11"
                  />
                  <span className="font-semibold text-2xl text-foreground">
                    ForgeRouter
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const amount = payment.total_amount / 100;
  const currency = payment.currency.toUpperCase();
  const productId = payment.product_cart?.[0]?.product_id;
  const creditsAdded = 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-2xl overflow-auto bg-gradient-to-br from-green-600/20  via-background to-green-600/20 p-4 ">
      <div className="w-full max-w-md">
        <Card className="border shadow-2xl  bg-card">
          <CardContent className="p-8 pb-3">
            {/* Success Icon (static) */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-green-500 shadow-lg">
                  <Check className="h-8 w-8 text-white stroke-[3]" />
                </div>
              </div>
            </div>

            {/* Heading */}
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-2xl font-semibold text-foreground">
                You're all set to route smarter!
              </h1>
              <p className="text-sm text-muted-foreground">
                time to build something amazing
              </p>
            </div>

            {/* Transaction Details */}
            <div className="space-y-6 pb-6 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Amount Paid
                </span>
                <span className="text-lg font-semibold text-foreground">
                  {amount.toFixed(2)} {currency}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Credits Added
                </span>
                <AnimatedCounter
                  value={creditsAdded ?? 0}
                  className="text-lg font-bold text-foreground"
                />
              </div>
            </div>

            {/* Transaction ID */}
            <div className="py-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Transaction ID
              </p>
              <p className="text-xs font-mono text-muted-foreground/70 break-all">
                {payment.payment_id}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button
                asChild
                size="default"
                className="w-full font-medium group"
              >
                <Link href="/">
                  Return to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center">
              <p className="text-xs text-muted-foreground">
                Thank you for choosing
              </p>
              <div className="flex mt-2.5 gap-1.5 items-center justify-center">
                <Image
                  width={200}
                  height={200}
                  src="/logo-icon.png"
                  alt="ForgeRouter Logo"
                  className="sm:size-[40px] size-11"
                />
                <span className="font-semibold text-2xl text-foreground">
                  ForgeRouter
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
