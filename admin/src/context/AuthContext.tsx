"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";
import { login as userLogin } from "@/lib/services/admin";
import { Admin } from "@/lib/services/admin";

const AuthContext = createContext<any>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<Admin | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      
      const res = await api.getAdmin(uid);

      if (res.ok) {
        setUser(res.admin);
        setIsAuthenticated(true);
        sessionStorage.setItem("amac_admin", JSON.stringify(res.admin));
        setUid(res.admin.uid);
        setToken(res.token);
        document.cookie = `arums_token=${res.token}; path=/; max-age=259200`; // 3 days
      } else {
        throw new Error(res.message || "Failed to refresh user data");
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      setError(null);
      const res = await userLogin(email, password);

      if (res.ok) {
        setUser(res.admin);
        setIsAuthenticated(true);
        sessionStorage.setItem("amac_admin", JSON.stringify(res.admin));
        setUid(res.admin.uid);
        setToken(res.token);
        document.cookie = `arums_token=${res.token}; path=/; max-age=259200`; // 3 days

        router.replace("/admin");
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    document.cookie = "arums_token=; path=/; max-age=0";
    localStorage.removeItem("loggedIn");
    sessionStorage.removeItem("amac_admin");
    setUser(null);
    setIsAuthenticated(false);
    setToken(null);
    setUid(null);
    router.push("/auth/login");
  };

  // Get admin data function
  useEffect(() => {
    try {
      const adminData = sessionStorage.getItem("amac_admin");
      const cookieData = document.cookie
        .split("; ")
        .find((row) => row.startsWith("arums_token="));

      if (adminData) {
        const parsedAdmin = JSON.parse(adminData);
        setIsAuthenticated(true);
        setToken(cookieData ? cookieData.split("=")[1] : null);
        setUser(parsedAdmin);
        setUid(parsedAdmin?.uid || null);
      } else {
        setIsAuthenticated(false);
        setToken(null);
        setUser(null);
        setUid(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to restore session"));
      setIsAuthenticated(false);
      setToken(null);
      setUser(null);
      setUid(null);
    } finally {
      setLoading(false);
    }
  }, []);


  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    token,
    uid,
    login,
    logout,
    refresh,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};
