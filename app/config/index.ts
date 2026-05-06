// export const API_URL="http://10.169.28.228:5000"
export const API_URL="https://arum-server.onrender.com"

export const formatCurrency = (amount: number, currency: string = "NGN") => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
