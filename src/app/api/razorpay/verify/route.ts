import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    
    const userId = req.cookies.get("recme_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay secret is not configured" },
        { status: 500 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Payment is verified. Update the user to Pro.
    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from("users")
      .update({ is_pro: true })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating user to Pro:", updateError);
      return NextResponse.json({ error: "Failed to update pro status" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
