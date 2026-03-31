import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get("recme_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { error: "Razorpay keys are not configured" },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: 29900, // amount in paise (₹299.00)
      currency: "INR",
      receipt: `rcpt_${userId.slice(0, 8)}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({ 
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID 
    }, { status: 200 });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
