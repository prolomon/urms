import { API_URL } from "@/config";
import { AUTH_MEMBER, AUTH_MEMBER_TOKEN, AUTH_MEMBER_WALLET, AUTH_MEMBER_WALLET_STATE } from "@/lib/api"
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Member } from "@/lib/types";
import { createSecurityCode, verifySecurityCode, login as MemberLogin, getMember } from "@/lib/services/member";

type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "QUARTERLY";

export type User = {
  uid?: string;
  fullname?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  businessType?: string;
  password?: string;
  confirm?: string;
  location?: string;
  avatar?: string;
  agent: string;
  role?: "USER" | "ADMIN";
  billingFrequency?: Frequency;
  createdAt?: string;
  updatedAt?: string;
  type?: "BUSINESS" | "INDIVIDUAL";
  balance?: number;
  dueBalance?: number;
  due?: Date;
};

export type Notification = {
  title: string;
  description: string;
  date: string;
  type:
  | "UPDATE"
  | "SUCCESS"
  | "FAILED"
  | "PENDING"
  | "REQUEST"
  | "REMINDER"
  | "WELCOME";
};

export type Payment = {
  reference: string;
  userId: string;
  businessName: string;
  businessType: BusinessType;
  frequency: Frequency;
  date: string;
  amount: number;
  payment: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED";
  due: Date | null;
  isVerified: boolean;
};

type AuthContextValue = {
  currentUser: Member | null;
  loading: boolean;
  login: (
    uid: string,
    password: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (
    uid: string,
    password: string,
    confirm: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  billing: (
    frequency: Frequency,
    due: Date,
  ) => Promise<{ ok: boolean; message?: string }>;
  notifications: () => Promise<Notification[]>;
  receipt: (reference: string) => Promise<Payment | any>;
  payments: () => Promise<Payment[]>;
  createPayment: (
    reference: string,
    amount: number,
    payment: string,
    status?: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED",
    due?: Date,
  ) => Promise<{ ok: boolean; message: string; payment?: any }>;
  agentList: () => Promise<any[]>;
  getBusiness: () => Promise<BusinessType[]>;
  setBalance: (
    newBalance: number,
  ) => Promise<{ ok: boolean; message?: string }>;
  setDueBalance: (
    dueBalance?: number,
  ) => Promise<{ ok: boolean; message?: string }>;
  token: string | undefined;
  createCode: (
    secureToken: string,
    confirmSecureToken: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  uid?: string;
  wallet: any;
  verifyCode: (
    secureToken: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
};

export type BusinessType = {
  id?: string;
  title: string;
  price: string;
  type: "BUSINESS" | "INDIVIDUAL";
  benefit: string;
};

const AUTH_CURRENT_KEY = "miRvAy3HC/25KEoA";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeUser(user: any): Member {
  return {
    uid: user.uid,
    fullname: user.fullname,
    businessName: user.businessName,
    center: user.center,
    email: user.email,
    phone: user.phone,
    type: user.type,
    category: user.category,
    company: user.company,
    billingFrequency: user.billingFrequency,
    password: user.password,
    location: {
      state: user.location.state,
      city: user.location.city,
      address: user.location.address,
      zipcode: user.location.zipcode,
      nearestBusStop: user.uid,
    },
    status: user.status,
    avatar: user.avatar,
    pricing: user.pricing,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    agent: user.agent,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [uid, setUid] = useState<string | undefined>(undefined);
  const [wallet, setWallet] = useState<any>(null);

  const refreshUser = async () => {
    try {

      const res = await getMember(currentUser?.uid || "", token || "");
      const updatedUser = res?.member || res?.data || res;
      const normalized = normalizeUser(updatedUser);
      await AsyncStorage.setItem(AUTH_MEMBER, JSON.stringify(normalized));
      setCurrentUser(normalized);

    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const cur = await AsyncStorage.getItem(AUTH_MEMBER);
        if (cur) {
          setCurrentUser(normalizeUser(JSON.parse(cur)));
        }

        const wal = await AsyncStorage.getItem(AUTH_MEMBER_WALLET);
        if (wal) {
          setWallet(JSON.parse(wal));
        }
        const tok = await AsyncStorage.getItem(AUTH_MEMBER_TOKEN);
        if (tok) {
          setToken(tok);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (uid: string, password: string) => {
    try {

      const response = await MemberLogin(uid, password);

      console.log('Login Response:', response);
      const normalized = normalizeUser(response.member || {});

      await AsyncStorage.setItem(AUTH_MEMBER, JSON.stringify(normalized));
      await AsyncStorage.setItem(AUTH_MEMBER_TOKEN, response.token || "");
      setToken(response.token || "");

      setCurrentUser(normalized);

      return { ok: true, message: response.message || "Login successful" };

    } catch (e: any) {
      return { ok: false, error: e?.message || e?.error || "Login failed" };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem(AUTH_MEMBER);
    setCurrentUser(null);
  };

  const forgotPassword = async (
    uid: string,
    password: string,
    confirm: string,
  ) => {
    try {
      if (!uid) return { ok: false, message: "User ID is required" };

      const response = await fetch(
        `${API_URL}/api/member/forgot-password/${uid}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password, confirm }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          ok: false,
          message: error.message || "Failed to reset password",
        };
      }

      const data = await response.json();
      return {
        ok: true,
        message: data.message || "Password reset email sent successfully",
      };
    } catch (e: any) {
      return {
        ok: false,
        message: e?.message || "Failed to process password reset",
      };
    }
  };

  const billing = async (frequency: Frequency, due: Date) => {
    try {
      if (!currentUser) return { ok: false, message: "Not authenticated" };
      if (!currentUser.uid) return { ok: false, message: "User ID not found" };

      const response = await fetch(
        `${API_URL}/api/member/${currentUser.uid}/billing-frequency`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentUser.uid || ""}`,
            "x-user-id": currentUser.uid,
          },
          body: JSON.stringify({ frequency: frequency.toUpperCase(), due }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        return { ok: false, message: error.message || "Billing update failed" };
      }

      const updatedUser = await response.json();
      const normalized = normalizeUser(updatedUser?.member || {});
      await AsyncStorage.setItem(AUTH_CURRENT_KEY, JSON.stringify(normalized));
      setCurrentUser(normalized);
      return { ok: true, message: "Billing frequency updated successfully" };
    } catch (e: any) {
      return { ok: false, message: e?.message || "Billing update failed" };
    }
  };

  const notifications = async (): Promise<Notification[]> => {
    try {
      if (!currentUser) return [];
      if (!currentUser.uid) return [];

      const response = await fetch(
        `${API_URL}/api/notification/${currentUser.uid}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentUser.uid || ""}`,
            "x-user-id": currentUser.uid,
          },
        },
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.notifications || [];
    } catch (e) {
      return [];
    }
  };

  const receipt = async (reference: string) => {
    try {
      if (!currentUser) return {};
      if (!currentUser.uid) return {};

      const response = await fetch(
        `${API_URL}/api/payment/reference/${reference}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentUser.uid || ""}`,
            "x-user-id": currentUser.uid,
          },
        },
      );

      if (!response.ok) {
        return {};
      }

      const data = await response.json();
      return data.payment || {};
    } catch (e) {
      return {};
    }
  };

  const payments = async (): Promise<Payment[]> => {
    try {
      if (!currentUser) return [];
      if (!currentUser.uid) return [];

      const response = await fetch(
        `${API_URL}/api/payment/user/${currentUser.uid}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentUser.uid || ""}`,
            "x-user-id": currentUser.uid,
          },
        },
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.payments || [];
    } catch (e) {
      return [];
    }
  };

  const createPayment = async (
    reference: string,
    amount: number,
    payment: string,
    status?: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED",
    due?: Date,
  ) => {
    try {
      if (!currentUser) return { ok: false, message: "Not authenticated" };
      if (!currentUser.uid) return { ok: false, message: "User ID not found" };

      const response = await fetch(`${API_URL}/api/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.uid || ""}`,
          "x-user-id": currentUser.uid,
        },
        body: JSON.stringify({
          reference: reference,
          userId: currentUser.uid,
          businessName: currentUser.businessName || "",
          // businessType: currentUser.businessType || "MEDIUM",
          frequency: currentUser.billingFrequency || "MONTHLY",
          amount: amount,
          payment: payment,
          status: status?.toUpperCase() || "PENDING",
          due: due ? due.toISOString() : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          ok: false,
          message: error.message || "Payment creation failed",
        };
      }

      const data = await response.json();
      return {
        ok: true,
        message: data.message || "Payment created successfully",
        payment: data.payment,
      };
    } catch (e: any) {
      return { ok: false, message: e?.message || "Payment creation failed" };
    }
  };

  const agentList = async () => {
    try {
      const response = await fetch(`${API_URL}/api/agent/list`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.data || data.agents || [];
    } catch (e) {
      return [];
    }
  };

  const getBusiness = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pricing`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.data || [];
    } catch (e) {
      return [];
    }
  };

  const setBalance = async (newBalance: number) => {
    try {
      if (!currentUser) return { ok: false, message: "Not authenticated" };
      if (!currentUser.uid) return { ok: false, message: "User ID not found" };

      const response = await fetch(
        `${API_URL}/api/member/${currentUser.uid}/balance`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentUser.uid || ""}`,
            "x-user-id": currentUser.uid,
          },
          body: JSON.stringify({ balance: newBalance }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        return { ok: false, message: error.message || "Balance update failed" };
      }

      const updatedUser = await response.json();
      const normalized = normalizeUser(updatedUser?.member || {});
      await AsyncStorage.setItem(AUTH_CURRENT_KEY, JSON.stringify(normalized));
      setCurrentUser(normalized);
      return { ok: true, message: "Balance updated successfully" };
    } catch (e: any) {
      return { ok: false, message: e?.message || "Balance update failed" };
    }
  };

  const setDueBalance = async (dueBalance?: number) => {
    try {
      if (!currentUser) return { ok: false, message: "Not authenticated" };
      if (!currentUser.uid) return { ok: false, message: "User ID not found" };

      const response = await fetch(
        `${API_URL}/api/member/${currentUser.uid}/due-balance`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentUser.uid || ""}`,
            "x-user-id": currentUser.uid,
          },
          body: JSON.stringify({ dueBalance: dueBalance }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        return { ok: false, message: error.message || "Balance update failed" };
      }

      const updatedUser = await response.json();
      console.log('Updated User:', updatedUser);
      const normalized = normalizeUser(updatedUser?.member || {});
      await AsyncStorage.setItem(AUTH_CURRENT_KEY, JSON.stringify(normalized));
      setCurrentUser(normalized);
      return { ok: true, message: "Balance updated successfully" };
    } catch (e: any) {
      return { ok: false, message: e?.message || "Balance update failed" };
    }
  };

  const createCode = async (secureToken: string, confirmSecureToken: string,) => {

    try {

      const response = await createSecurityCode(currentUser?.uid || "", secureToken, confirmSecureToken, token as string);

      if (!response.ok) {
        return { ok: false, message: response.message || "Security code creation failed" };
      }

      return { ok: true, message: response.message || "Security code created successfully" };

    } catch (error: any) {
      return { ok: false, message: "An error occurred while creating the security code" };
    }

  }

  const verifyCode = async (secureToken: string) => {

    try {

      const response = await verifySecurityCode(currentUser?.uid || "", secureToken, token as string);

      if (!response.ok) {
        return { ok: false, message: response.message || "Security code verification failed" };
      }

      return { ok: true, message: response.message || "Security code verified successfully" };

    } catch (error: any) {
      return { ok: false, message: "An error occurred while verifying the security code" };
    }

  }

  const value: AuthContextValue = {
    currentUser,
    loading,
    login,
    logout,
    forgotPassword,
    billing,
    notifications,
    receipt,
    payments,
    createPayment,
    agentList,
    getBusiness,
    setBalance,
    setDueBalance,
    token,
    createCode,
    uid,
    wallet,
    verifyCode,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
