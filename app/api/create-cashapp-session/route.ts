import { NextResponse } from "next/server"
import Stripe from "stripe"

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
})

export async function POST(req: Request) {
  try {
    const { amount } = await req.json()

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["cashapp"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Stitches Exchanges Payment",
              description: "Payment via Cash App",
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/cashapp-pay`,
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error("Error creating Cash App payment session:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create payment session" },
      { status: 500 },
    )
  }
}
