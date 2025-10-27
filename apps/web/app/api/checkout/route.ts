import { auth } from "@/lib/auth";
import { prisma } from "@/db";
import { NextRequest, NextResponse } from "next/server";

async function geolocateIP(
  ip: string
): Promise<{ country: string; state: string; city: string }> {
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    if (res.ok) {
      const data = await res.json();
      // Ensure non-empty fallbacks
      return {
        country: data.country_code || "US",
        state: data.region_code || (data.country_code === "IN" ? "MH" : "CA"),
        city:
          data.city ||
          (data.country_code === "IN" ? "Mumbai" : "San Francisco"),
      };
    }
  } catch (err) {
    console.warn("Geolocate failed:", err);
  }
  return { country: "US", state: "CA", city: "San Francisco" };
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, product_id } = await req.json();
    if (!slug) {
      return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
    }

    const userId = session.user.id;

    // Get geolocation
    let billingGeo: { country: string; state: string; city: string };

    if (process.env.NODE_ENV === "production") {
      const country = req.headers.get("x-vercel-ip-country");
      const state = req.headers.get("x-vercel-ip-country-region");
      const city = req.headers.get("x-vercel-ip-city");

      billingGeo = {
        country: country || "US",
        state: state || (country === "IN" ? "MH" : "CA"),
        city: city || (country === "IN" ? "Mumbai" : "San Francisco"),
      };
      console.log(
        `Vercel geo for ${userId}: ${billingGeo.country}/${billingGeo.state}/${billingGeo.city}`
      );
    } else {
      const currentSession = await prisma.session.findFirst({
        where: { token: session.session?.token },
        select: { ipAddress: true },
      });

      if (
        currentSession?.ipAddress &&
        !["127.0.0.1", "::1"].includes(currentSession.ipAddress)
      ) {
        billingGeo = await geolocateIP(currentSession.ipAddress);
        console.log(
          `Local dev geolocated IP for ${userId}: ${billingGeo.country}`
        );
      } else {
        billingGeo = { country: "US", state: "CA", city: "San Francisco" };
        console.log(`Local dev using defaults for ${userId}`);
      }
    }

    // Native payment methods
    let allowedMethods: string[] = ["card"];
    if (billingGeo.country === "IN")
      allowedMethods = ["card", "upi", "netbanking"];
    else if (billingGeo.country === "US") allowedMethods = ["card", "ach"];

    const referenceId = `order_${Date.now()}_${userId}`;
    // Create Dodo checkout
    const checkout = await auth.api.checkout({
      request: req,
      headers: req.headers,
      body: {
        slug,
        product_id,
        quantity: 1,
        customer: {
          email: session.user.email,
          name: session.user.name || "User",
        },
        billing: {
          country: billingGeo.country,
          city: billingGeo.city,
          state: billingGeo.state,
          street: "123 Main St",
          zipcode: billingGeo.country === "IN" ? "400001" : "94103",
        },
        referenceId,
        allowedPaymentMethods: allowedMethods,
      },
    });

    if (!checkout?.url) {
      console.error("Dodo checkout failed:", checkout);
      return NextResponse.json({ error: "Checkout failed" }, { status: 400 });
    }

    console.log(`Checkout created for ${userId}: ${checkout.url}`);
    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
