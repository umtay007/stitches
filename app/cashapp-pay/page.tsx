"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import RainBackground from "@/components/rain-background"
import GlitterBackground from "@/components/glitter-background"
import { MenuButton } from "@/components/menu-button"
import ThemeToggle from "@/components/theme-toggle"
import Logo from "@/components/logo"
import { loadStripe } from "@stripe/stripe-js"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

export default function CashAppPayPage() {
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const router = useRouter()

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, "")
    if (value === "" || (!isNaN(Number.parseFloat(value)) && isFinite(Number(value)))) {
      setAmount(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate input
      if (!amount || Number.parseFloat(amount) <= 0) {
        throw new Error("Please enter a valid amount")
      }

      if (!termsAccepted) {
        throw new Error("You must accept the terms of service")
      }

      // Create payment session
      const response = await fetch("/api/create-cashapp-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number.parseFloat(amount),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create payment session")
      }

      const { sessionId } = await response.json()

      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error("Stripe failed to initialize")
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      })

      if (stripeError) {
        throw new Error(stripeError.message || "Payment failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-24 relative overflow-hidden">
      <GlitterBackground />
      <RainBackground />
      <Logo />
      <MenuButton />
      <ThemeToggle />
      <div className="z-10 w-full max-w-md">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6 sm:mb-8 text-center relative">
          <AnimatedText>Cash App Pay</AnimatedText>
        </h1>
        <Card className="w-full bg-card/10 backdrop-blur-md rounded-2xl overflow-hidden shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-foreground">Pay with Cash App</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Quick and secure payments using Cash App
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-white">
                  Amount (USD)
                </Label>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={handleAmountChange}
                  className="bg-white bg-opacity-20 text-white placeholder-gray-400 rounded-xl"
                />
              </div>

              <div className="bg-black/20 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                  <h3 className="text-white font-semibold">Terms of Service</h3>
                </div>
                <ul className="space-y-2 text-sm text-white/80 list-disc pl-5">
                  <li>Payments have to be sent by you</li>
                  <li>Payments must be sent with balance</li>
                  <li>
                    You must provide a screen recording of you sending the payment (Discord/Telegram chats must be shown
                    within the screen recording)
                  </li>
                  <li>No sussy business</li>
                </ul>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="rounded border-gray-500 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="terms" className="text-white text-sm">
                    I agree to the terms of service
                  </Label>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-white p-3 rounded-xl text-sm">{error}</div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={loading || !termsAccepted}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
              >
                {loading ? "Processing..." : "Pay with Cash App"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  )
}

function AnimatedText({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block transition-transform duration-200 hover:scale-110 cursor-default">{children}</span>
  )
}
