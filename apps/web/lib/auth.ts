import {
  checkout,
  dodopayments,
  portal,
  webhooks,
} from "@dodopayments/better-auth";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import DodoPayments from "dodopayments";
import { prisma } from "./db";
import {
  handlePaymentFailed,
  handlePaymentSucceeded,
} from "./payments/one-time";

export const dodoPayments = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment: "test_mode",
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  plugins: [
    dodopayments({
      client: dodoPayments,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: "pdt_ptFsKbWKcGsTJIKm8jwWi",
              slug: "forge-starter-pack",
            },
            {
              productId: "pdt_ytCHc8Vq5wgxCR3YLNxYE",
              slug: "forge-pro-pack",
            },
          ],
          successUrl: "/payment/status",
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET!,
          onPayload: async (payload) => {
            console.log("Received webhook:", payload.type);

            switch (payload.type) {
              case "payment.succeeded":
                await handlePaymentSucceeded(payload.data);
                break;
              case "payment.failed":
                await handlePaymentFailed(payload.data);
                break;
              default:
                console.log(`Unhandled webhook event: ${payload.type}`);
            }
          },
        }),
      ],
    }),
  ],

  databaseHooks: {
    user: {
      create: {
        after: async (user, ctx) => {
          console.log(`New user created: ${user.email}`);
          if (!user.id) {
            console.error("User created but ID is missing.");
            return;
          }

          try {
            // await prisma.wallet.create({
            //   data: { userId: user.id }
            // });
          } catch (error) {
            console.error("Failed to create resources for new user:", error);
          }
        },
      },
    },
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: true,
      },
    },
  },

  trustedOrigins: ["http://localhost:3000"],

  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL!,
  secret: process.env.BETTER_AUTH_SECRET!,

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/github`,
      mapProfileToUser: (profile) => {
        return {
          email: profile.email,
          name: profile.name || profile.login,
          image: profile.avatar_url,
          emailVerified: !!profile.email,
          username: profile.login,
        };
      },
    },
  },

  emailAndPassword: {
    enabled: true,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },

  redirectTo: {
    afterSignIn: "/",
    afterSignUp: "/",
    afterSignOut: "/sign-in",
  },
}) as ReturnType<typeof betterAuth>;
