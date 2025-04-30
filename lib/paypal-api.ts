import { PAYPAL_API_URL, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } from "./paypal-config"

// Function to get PayPal access token
export async function getPayPalAccessToken() {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64")
    const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body: "grant_type=client_credentials",
    })

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error("Error getting PayPal access token:", error)
    throw new Error("Failed to authenticate with PayPal")
  }
}

// Function to create a PayPal order with Venmo as payment source
export async function createPayPalOrder(amount: number, successUrl: string, cancelUrl: string) {
  try {
    const accessToken = await getPayPalAccessToken()

    const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: amount.toFixed(2),
            },
            description: "Stitches Exchanges Payment",
          },
        ],
        payment_source: {
          venmo: {},
        },
        application_context: {
          return_url: successUrl,
          cancel_url: cancelUrl,
          user_action: "PAY_NOW",
          payment_method: {
            payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED",
          },
        },
      }),
    })

    const data = await response.json()

    if (response.status >= 400) {
      throw new Error(data.message || "Failed to create PayPal order")
    }

    return data
  } catch (error) {
    console.error("Error creating PayPal order:", error)
    throw error
  }
}

// Function to capture a PayPal order
export async function capturePayPalOrder(orderId: string) {
  try {
    const accessToken = await getPayPalAccessToken()

    const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })

    const data = await response.json()

    if (response.status >= 400) {
      throw new Error(data.message || "Failed to capture PayPal order")
    }

    return data
  } catch (error) {
    console.error("Error capturing PayPal order:", error)
    throw error
  }
}
