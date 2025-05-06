"use client"

import { useState } from "react"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"
import { Loader2 } from "lucide-react"

interface PayPalButtonProps {
  amount: number
  onSuccess: (details: any) => void
  onError: (error: any) => void
  className?: string
}

export default function PayPalButton({ amount, onSuccess, onError, className }: PayPalButtonProps) {
  const [loading, setLoading] = useState(false)

  // PayPal configuration
  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
    currency: "USD",
    intent: "capture",
  }

  return (
    <div className={className}>
      <PayPalScriptProvider options={paypalOptions}>
        <div className="relative">
          <div className={loading ? "opacity-50 pointer-events-none" : ""}>
            <PayPalButtons
              style={{
                layout: "vertical",
                color: "blue",
                shape: "pill",
                label: "pay",
              }}
              createOrder={async () => {
                try {
                  setLoading(true)
                  // Create a server-side order
                  const response = await fetch("/api/create-paypal-order", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      amount: amount,
                    }),
                  })

                  const orderData = await response.json()
                  if (!response.ok) {
                    throw new Error(orderData.error || "Failed to create order")
                  }

                  setLoading(false)
                  return orderData.id
                } catch (err) {
                  setLoading(false)
                  onError(err instanceof Error ? err : new Error("Unknown error"))
                  throw err
                }
              }}
              onApprove={async (data) => {
                try {
                  setLoading(true)
                  // Capture the order
                  const response = await fetch("/api/capture-paypal-order", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      orderId: data.orderID,
                    }),
                  })

                  const captureData = await response.json()
                  if (!response.ok) {
                    throw new Error(captureData.error || "Failed to capture order")
                  }

                  // Call the success callback
                  onSuccess(captureData)
                  setLoading(false)
                } catch (err) {
                  onError(err instanceof Error ? err : new Error("Unknown error"))
                  setLoading(false)
                }
              }}
              onError={(err) => {
                onError(err)
                setLoading(false)
              }}
            />
          </div>
          {loading && (
            <div className="absolute inset-0 flex justify-center items-center bg-black/30 rounded-xl">
              <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            </div>
          )}
        </div>
      </PayPalScriptProvider>
    </div>
  )
}
