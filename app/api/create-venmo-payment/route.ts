import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { createPayPalOrder } from "@/lib/paypal-api"

export async function POST(req: Request) {
  try {
    const { amount } = await req.json()
    const headersList = headers()

    // Get the host from headers to build absolute URLs
    const host = headersList.get("host") || "localhost:3000"
    const protocol = host.includes("localhost") ? "http" : "https"
    const baseUrl = `${protocol}://${host}`

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // Create success and cancel URLs
    const successUrl = `${baseUrl}/payment-success?source=venmo`
    const cancelUrl = `${baseUrl}/pay-me?canceled=true`

    // Create PayPal order with Venmo as payment source
    const order = await createPayPalOrder(amount, successUrl, cancelUrl)

    // Find the approval URL for Venmo
    const approvalLink = order.links.find((link: any) => link.rel === "approve")?.href

    if (!approvalLink) {
      throw new Error("No approval link found in PayPal response")
    }

    return NextResponse.json({
      orderId: order.id,
      approvalUrl: approvalLink,
    })
  } catch (error) {
    console.error("Error creating Venmo payment:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create Venmo payment" },
      { status: 500 },
    )
  }
}
