"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Company, getCompany, login as CompanyLogin } from "@/lib/services/company";

const PartnerContext = createContext<any>(null);

export const usePartner = () => {
  const context = useContext(PartnerContext);
  if (!context) {
    throw new Error("usePartner must be used within an PartnerProvider");
  }
  return context;
};

export const PartnerProvider = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<Company | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      
      const res = await getCompany(uid);

      if (res.ok) {
        setUser(res.company);
        setIsAuthenticated(true);
        sessionStorage.setItem("amac_company", JSON.stringify(res.company));
        setUid(res.company.uid);
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
      const res = await CompanyLogin(email, password);

      if (res.ok) {
        setUser(res.company);
        setIsAuthenticated(true);
        sessionStorage.setItem("amac_company", JSON.stringify(res.company));
        setUid(res.company.uid);
        setToken(res.token);
        document.cookie = `arums_token=${res.token}; path=/; max-age=259200`; // 3 days

        router.replace("/partner");
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
    sessionStorage.removeItem("amac_company");
    setUser(null);
    setIsAuthenticated(false);
    setToken(null);
    setUid(null);
    router.push("/partner/login");
  };

  // Get company data function
  useEffect(() => {
    try {
      const companyData = sessionStorage.getItem("amac_company");
      const cookieData = document.cookie
        .split("; ")
        .find((row) => row.startsWith("arums_token="));

      if (companyData) {
        const parsedCompany = JSON.parse(companyData);
        setIsAuthenticated(true);
        setToken(cookieData ? cookieData.split("=")[1] : null);
        setUser(parsedCompany);
        setUid(parsedCompany?.uid || null);
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
    <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>
  );
};
