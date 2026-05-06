 import { API_URL, buildHeaders } from "../api";
 import { Payment } from "../types";

 export async function getPayments(uid: string, token: string): Promise<{ok: boolean; payments?: Payment[]; message?: string}> { 
    if (!uid) {
        throw new Error("No user ID found");
    }
    const response = await fetch(`${API_URL}/payment/user/${uid}`, {
        headers: buildHeaders(true, token),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch payments");
    }
    return data;
}

export async function verifyPayment(reference: string, token: string): Promise<{
    ok: boolean;
    payment?: any;
    message?: string;
}> {
    if (!reference) {
        throw new Error("No payment reference provided");
    }
    const response = await fetch(`${API_URL}/payment/verify/${reference}`, {
        headers: buildHeaders(true, token),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to verify payment");
    }
    return data;
}

export async function getPayment(reference: string, token: string): Promise<{
    ok: boolean;
    payment?: any;
    message?: string;
}> {
    if (!reference) {
        throw new Error("No payment reference provided");
    }

    const response = await fetch(`${API_URL}/payment/reference/${reference}`, {
        headers: buildHeaders(true, token),
    });
    const data = await response.json(); 
    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch payment");
    }
    return data;
}

export async function schedulePayment(userId: string, frequency: string, amount: number, due: Date, token: string): Promise<{
    ok: boolean;
    payment?: any;
    message?: string;
}> {
    if (!userId) {
        throw new Error("No user ID provided");
    }
    const response = await fetch(`${API_URL}/payment/schedule/${userId}`, {
        method: "POST",
        headers: buildHeaders(true, token),
        body: JSON.stringify({
            userId,
            frequency,
            amount,
            due
        }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to schedule payment");
    }   
    return data;
}

export async function makePayment (userId: string, amount: number, paymentId: string, center: string, company: string, token: string): Promise<{
    ok: boolean;
    payment?: any;
    message?: string;
}> {
    if (!userId) {
        throw new Error("No user ID provided");
    }
    const response = await fetch(`${API_URL}/payment/make/${userId}/${paymentId}`, {
        method: "POST",
        headers: buildHeaders(true, token),
        body: JSON.stringify({ amount, center, company }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to make payment");
    }
    return data;
}