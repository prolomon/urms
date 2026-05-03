import { API_URL, buildHeaders } from "@/lib/api";
export type FormState = {
    fullname: string;
    email: string;
    phone: string;
    gender: string;
    state: string;
    lga: string;
    address: string;
    isCopper: string;
    accountNumber: string;
    bank: string;
    accountName: string;
    dob: string;

    id?: string;

    createdAt?: string;
    updatedAt?: string;
};

export type CreateRecruitmentPayload = Omit<FormState, "createdAt" | "updatedAt">;

export async function createRecruitment(
    payload: CreateRecruitmentPayload,
): Promise<{ ok: boolean; recruitment?: FormState; message?: string }> {
    const response = await fetch(`${API_URL}/recruitment/`, {
        method: "POST",
        headers: { ...buildHeaders(true) },
        body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to create recruitment record");
    }

    return data;
}

export async function getRecruitments(): Promise<{ ok: boolean; data?: FormState[]; message?: string; }> {
    const response = await fetch(`${API_URL}/recruitment/`, {
        headers: { ...buildHeaders(false) },
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch recruitment records");
    }

    return data;
}

export async function deleteRecruitment(
    id: string,
): Promise<{ ok: boolean; recruitment?: FormState; message?: string }> {
    const response = await fetch(`${API_URL}/recruitment/${id}`, {
        method: "DELETE",
        headers: { ...buildHeaders(true) },
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to delete recruitment record");
    }

    return data;
}
export async function getRecruitment(
    id: string,
): Promise<{ ok: boolean; data?: FormState; message?: string }> {
    const response = await fetch(`${API_URL}/recruitment/${id}`, {
        method: "GET",
        headers: { ...buildHeaders(false) },
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to fetch recruitment record");
    }

    return data;
}



