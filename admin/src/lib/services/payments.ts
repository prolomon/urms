import { API_URL, buildHeaders } from "../api";

export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "QUARTERLY";

export type Payment = {
  reference: string;
  userId: string;
  frequency: Frequency;
  date: string;
  amount: number;
  payment: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED";
  due: Date | null;
  isVerified: boolean;
  sessions:     string[];
  debt: number;      
  createdAt?: Date;
  updatedAt?: Date;
};

 export async function getPayments(): Promise<{ok: boolean; payments?: Payment[]; message?: string}> { 

    const response = await fetch(`${API_URL}/payment/`, {
        headers: {...buildHeaders()},
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch payments");
    }
    return data;
}