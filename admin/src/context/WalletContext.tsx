"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Wallet, getWallet, createWallet, createRecipient, initiateTransfer, resolveBankAccount, validateWallet } from "@/lib/services/wallet";

const walletContext = createContext<any>(null);

export const useWallet = () => {
    const context = useContext(walletContext);
    if (!context) {
        throw new Error("useWallet must be used within an WalletProvider");
    }
    return context;
};

export const WalletProvider = ({ children }) => {
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [isWallet, setIsWallet] = useState<boolean>(false); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null); 
    const [message, setMessage] = useState<string | null>(null);
    const [customerCode, setCustomerCode] = useState<string | null>(null);
    const [uid, setUid] = useState<string | null>(null);

    // Get CustomerCode from session storage on initial load
    useEffect(() => {
        const adminData = sessionStorage.getItem("amac_admin");

        if (adminData) {
            const parsedAdmin = JSON.parse(adminData);
            setCustomerCode(
                parsedAdmin.paystackCustomerCode ?? parsedAdmin.customerCode ?? null,
            );
            setUid(parsedAdmin.uid ?? null);
        } else {
            setCustomerCode(null);
            setUid(null);
        }
    }, []);

    // Fetch wallet data when customerCode is available

    const fetchWallet = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (!customerCode || !uid) {
                setIsWallet(false);
                setWallet(null);
                setMessage("No customer code found for this account.");
                return;
            }

            const { ok, wallet, message, isExist } = await getWallet(uid, "admin");

            if (isExist) {
                if (ok && wallet) {
                    setIsWallet(true);
                    setWallet(wallet);
                } else {
                    setIsWallet(false);
                    setWallet(null);
                }
            } else {
                await createWallet(customerCode, uid, "admin");

                const created = await getWallet(uid, "admin");
                if (created.ok && created.wallet) {
                    setIsWallet(true);
                    setWallet(created.wallet);
                    setMessage(created.message || "Wallet created successfully");
                } else {
                    setIsWallet(false);
                    setWallet(null);
                    setMessage(created.message || "Wallet could not be created");
                }
                return;
            }

            setMessage(message || null);

        } catch (error) {
            console.error("Error fetching wallet:", error);
            setIsWallet(false);
            setError(error instanceof Error ? error : new Error("Unknown error"));
        } finally {
            setLoading(false);
        }

    }, [customerCode, uid]);

    useEffect(() => {
        fetchWallet();
    }, [fetchWallet]);

    const refresh = useCallback(() => {
        fetchWallet();
    }, [fetchWallet]);

    const value = {
        wallet,
        isWallet,
        loading,
        error,
        message,
        refresh,
        setUid,
        setCustomerCode,
        createRecipient, 
        initiateTransfer, 
        resolveBankAccount,
        validateWallet
    };

    return (
        <walletContext.Provider value={value}>{children}</walletContext.Provider>
    );
};
