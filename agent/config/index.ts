export const API_URL=process.env.EXPO_PUBLIC_API_URL + "/api"

export const PAYSTACK_PUBLIC_KEY=process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY

export const formatCurrency = (amount: number, currency: string = "NGN") => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

