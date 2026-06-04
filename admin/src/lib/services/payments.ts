import { API_URL, buildHeaders } from "../api";
import { TransactionStatus } from "./wallet";

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

export type PaymentTransaction = {
  id: string;
  reference: string;
  userId: string;
  pricingId: string;
  companyId: string;
  centerId: string
  amount: string;
  agentId?: string | null;
  currency: string
  paymentId: string;
  date: Date;
  type: string;
  category: string
  name: string;
  billing: string;
  status: TransactionStatus;
  metadata: any | null;
  createdAt: Date;
  updatedAt: Date;
}


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

export async function getRecords(id: string, fromDate?: string, toDate?: string, query?: string): Promise<{ok: boolean;transactions?: PaymentTransaction[]; message?: string}> { 
    if (!id) {
        throw new Error("No user ID found");
    }
    const params = new URLSearchParams();

    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    if (query) params.set("query", query);

    const queryString = params.toString();
    const response = await fetch(`${API_URL}/payment-transaction/user/company/${id}${queryString ? `?${queryString}` : ""}`, {
        headers: {...buildHeaders()},
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch payments");
    }
    return data;
}

export async function getRecord(id: string): Promise<{ok: boolean; transaction?: PaymentTransaction; message?: string}> { 
    if (!id) {
        throw new Error("No record ID found");
    }
    const response = await fetch(`${API_URL}/payment-transaction/reference/${id}`, {
        headers: {...buildHeaders()},
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch payment");
    }
    return data;
}

export const getTransactions = async (page: number, limit: number) => {
    const response = await fetch(`${API_URL}/payment-transaction/?page=${page}&limit=${limit}`, {
        headers: {...buildHeaders()},
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch transactions");
    }
    return data;
}