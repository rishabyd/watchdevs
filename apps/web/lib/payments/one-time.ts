import { resend } from "../helpers/email/resend";
import { emailPayload } from "./email-template";

export async function handlePaymentSucceeded(paymentData: any) {
  try {
    console.log("Processing successful payment:", {
      paymentId: paymentData.payment_id,
      amount: paymentData.total_amount,
      referenceId: paymentData.metadata?.referenceId,
    });

    // Validate referenceId - NO FALLBACKS ALLOWED
    const referenceId = paymentData.metadata?.referenceId;
    if (!referenceId) {
      throw new Error("No referenceId found in payment metadata");
    }

    // Validate referenceId format: "order_<timestamp>_<userId>"
    const referenceIdPattern = /^order_\d+_[a-zA-Z0-9]+$/;
    if (!referenceIdPattern.test(referenceId)) {
      throw new Error(
        `Invalid referenceId format: ${referenceId}. Expected format: order_<timestamp>_<userId>`,
      );
    }

    const referenceIdParts = referenceId.split("_");
    const userId = referenceIdParts[referenceIdParts.length - 1];

    // Additional validation for userId
    if (!userId || userId.length < 10) {
      throw new Error(
        `Invalid userId extracted from referenceId: ${referenceId}`,
      );
    }

    console.log("Extracted userId:", userId);

    // Calculate credits based on product_id - NO FALLBACKS for security
    const productId = paymentData.product_cart?.[0]?.product_id;
    const creditsToAdd = getCreditsForProductId(productId);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    console.log("User found:", user.email);

    // Process payment with transaction
    await prisma.$transaction(
      async (tx) => {
        // Check for duplicate processing
        const existingTransaction = await tx.transaction.findFirst({
          where: { gatewayTransactionId: paymentData.payment_id },
        });

        if (existingTransaction) {
          console.log("Transaction already processed:", paymentData.payment_id);
          return;
        }

        // Update wallet balance
        const updatedWallet = await tx.wallet.update({
          where: { userId },
          data: {
            balanceCredits: { increment: BigInt(creditsToAdd) },
          },
        });

        // Create transaction record
        const res = await tx.transaction.create({
          data: {
            userId,
            type: "TOPUP",
            amountCredits: BigInt(creditsToAdd),
            runningBalanceCredits: updatedWallet.balanceCredits,
            paymentAmountUsd: paymentData.total_amount / 100,
            paymentGateway: "dodo_payments",
            gatewayTransactionId: paymentData.payment_id,
          },
          select: { runningBalanceCredits: true },
        });
        const data = emailPayload(
          user.email,
          paymentData,
          creditsToAdd,
          Number(res.runningBalanceCredits),
        );
        await resend.emails.send(data);
        console.log(
          `Successfully added ${creditsToAdd} credits to user ${userId}`,
        );
      },
      { timeout: 10000 },
    );
  } catch (error) {
    console.error("Error processing successful payment:", {
      error: error instanceof Error ? error.message : "Unknown error",
      paymentId: paymentData.payment_id,
      referenceId: paymentData.metadata?.referenceId,
    });
    throw error;
  }
}

export async function handlePaymentFailed(paymentData: any) {
  try {
    console.log("Processing failed payment:", {
      paymentId: paymentData.payment_id,
      amount: paymentData.total_amount,
      referenceId: paymentData.metadata?.referenceId,
    });

    // Log failed payment for monitoring
  } catch (error) {
    console.error("Error processing failed payment:", error);
  }
}
