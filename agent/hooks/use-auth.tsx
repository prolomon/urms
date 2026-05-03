import { API_URL, AUTH_AGENT, AUTH_AGENT_TOKEN, AUTH_AGENT_WALLET } from "@/lib/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

import { AuthContextValue, Member, Notification, Payment, User, Wallet } from "../lib/types";
import { login as AgentLogin, forgetPassword, resetPassword, createSecurityCode, forgetSecurityCode, verifySecurityCode } from "@/lib/services/agent";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeUser(user: any): User {
  return {
    uid: user?.uid ?? "",
    fullname: user?.fullname ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    location: user?.location ?? "",
    avatar: user?.avatar,
    role: user?.role ?? "AGENT",
    createdAt: user?.createdAt,
    updatedAt: user?.updatedAt,
    id: user?.id,
    gender: user?.gender,
    status: user?.status,
    center: user?.center,
    batchNo: user?.batchNo,
    paystackCustomerId: user?.paystackCustomerId,
    paystackCustomerCode: user?.paystackCustomerCode,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        const cur = await AsyncStorage.getItem(AUTH_AGENT);
        if (cur) {
          setCurrentUser(normalizeUser(JSON.parse(cur)));
        }
        const wal = await AsyncStorage.getItem(AUTH_AGENT_WALLET);
        if (wal) {
          setWallet(JSON.parse(wal));
        }
        const tok = await AsyncStorage.getItem(AUTH_AGENT_TOKEN);
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

  const register = async (user: Omit<Member, "uid" | "role" | "createdAt">) => {
    try {
      const response = await fetch(`${API_URL}/member`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });

      if (!response.ok) {
        const error = await response.json();
        return { ok: false, message: error.message || "Registration failed" };
      }

      await response.json();
      
      return {
        ok: true,
        message: "Registration successful",
      };
    } catch (e: any) {
      return { ok: false, message: e?.message || "Registration failed" };
    }
  };

  const login = async (uid: string, password: string) => {
    try {

      const response = await AgentLogin(uid, password);
      const normalized = normalizeUser(response.agent || {});

      await AsyncStorage.setItem(AUTH_AGENT, JSON.stringify(normalized));
      await AsyncStorage.setItem(AUTH_AGENT_TOKEN, response.token || "");
      setToken(response.token || "");

      setCurrentUser(normalized);

      return { ok: true, message: response.message || "Login successful" };

    } catch (e: any) {
      return { ok: false, error: e?.message || e?.error || "Login failed" };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem(AUTH_AGENT);
    await AsyncStorage.removeItem(AUTH_AGENT_WALLET);
    await AsyncStorage.removeItem(AUTH_AGENT_TOKEN);
    setCurrentUser(null);
  };

  const updateProfile = async (updates: Partial<User>, token?: string) => {
    try {
      if (!currentUser) return { ok: false, message: "Not authenticated" };
      if (!currentUser.uid) return { ok: false, message: "User ID not found" };

      const response = await fetch(`${API_URL}/api/agent/${currentUser.uid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || currentUser.uid || ""}`,
          "x-user-id": currentUser.uid,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        return { ok: false, message: error.message || "Update failed" };
      }

      const updatedUser = await response.json();
      const normalized = normalizeUser(updatedUser?.agent || {});

      await AsyncStorage.setItem(AUTH_AGENT, JSON.stringify(normalized));
      setCurrentUser(normalized);
      return { ok: true, message: "Profile updated successfully" };
    } catch (e: any) {
      return { ok: false, message: e?.message || "Update failed" };
    }
  };

  const forgot = async (uid: string, password: string, confirm: string, old: string) => {
    try {
      if (!uid) return { ok: false, message: "User ID is required" };

      const response = await forgetPassword(old, password, confirm, uid, token as string);

      if (!response.ok) {
        return { ok: false, message: response.message || "Password change failed" };
      }

      return { ok: true, message: response.message || "Password changed successfully" };
    } catch (e: any) {
      return { ok: false, message: e?.message || "Password change failed" };
    }
  };

  const reset = async (uid: string) => {
    try {
      if (!uid) return { ok: false, message: "User ID is required" };

      const response = await resetPassword(uid, token as string);

      if (!response.ok) {
        return { ok: false, message: response.message || "Password change failed" };
      }

      return { ok: true, message: response.message || "Password changed successfully" };
    } catch (e: any) {
      return { ok: false, message: e?.message || "Password change failed" };
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

  const members = async (): Promise<Member[]> => {
    try {
      if (!currentUser) return [];
      if (!currentUser.uid) return [];

      const response = await fetch(`${API_URL}/member/agent/${currentUser.uid}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return Array.isArray(data) ? data : (data?.members || data?.data || []);
    } catch (e: any) {
      return [];
    }
  }

  const verifyPayment = async (reference: string) => {
    try {
      if (!currentUser) return {
        ok: false,
        message: "Not authenticated",
        fullname: "",
        memberName: "",
        businessName: "",
        userId: "",
      };
      if (!currentUser.uid) return {
        ok: false,
        message: "User ID not found",
        fullname: "",
        memberName: "",
        businessName: "",
        userId: "",
      };

      const response = await fetch(
        `${API_URL}/api/payment/verify/${reference}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentUser.uid || ""}`,
            "x-user-id": currentUser.uid,
          },
        },
      );

      if (!reference || !response.ok) {
        return {
          ok: false,
          message: "Verification failed",
          fullname: "",
          memberName: "",
          businessName: "",
          userId: "",
        };
      }

      const data = await response.json();
      return {
        ok: true,
        payment: data.payment,
        fullname: data.payment?.fullname || "",
        memberName: data.payment?.memberName || "",
        businessName: data.payment?.businessName || "",
        userId: data.payment?.userId || "",
      };
    } catch (e) {
      return {
        ok: false,
        message: "Verification failed",
        fullname: "",
        memberName: "",
        businessName: "",
        userId: "",
      };
    }
  }

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

  const changeCode = async (oldSecureToken: string, newSecureToken: string, confirmSecureToken: string) => {

    try {

      const response = await forgetSecurityCode(currentUser?.uid || "", oldSecureToken, newSecureToken, confirmSecureToken, token as string);

      if (!response.ok) {
        return { ok: false, message: response.message || "Security code change failed" };
      }

      return { ok: true, message: response.message || "Security code changed successfully" };

    } catch (error: any) {
      return { ok: false, message: "An error occurred while changing the security code" };
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
    wallet,
    currentUser,
    loading,
    register,
    login,
    logout,
    updateProfile,
    forgot,
    notifications,
    receipt,
    payments,
    members,
    verifyPayment,
    agentList,
    getBusiness,
    token,
    createCode,
    changeCode,
    verifyCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
