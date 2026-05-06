"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Wallet, getWallet, createWallet, initiateTransfer, resolveBankAccount, getBanks, getTransactions } from "@/lib/services/wallet";

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
    const [uid, setUid] = useState<string | null>(null);

    // Fetch wallet data when customerCode is available
    const fetchWallet = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (!uid) {
                setIsWallet(false);
                setWallet(null);
                setMessage("No user ID found for this account.");
                return;
            }

            const { ok, wallet, message, isExist } = await getWallet(uid, "ADMIN");

            if (isExist) {
                if (ok && wallet) {
                    setIsWallet(true);
                    setWallet(wallet);
                } else {
                    setIsWallet(false);
                    setWallet(null);
                }
            } else {
                    setIsWallet(false);
                    setWallet(null);
                    setMessage(message || "Wallet could not be created");
            }

            setMessage(message || null);

        } catch (error) {
            console.error("Error fetching wallet:", error);
            setIsWallet(false);
            setError(error instanceof Error ? error : new Error("Unknown error"));
        } finally {
            setLoading(false);
        }

    }, [uid]);

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
        createWallet,
        initiateTransfer, 
        resolveBankAccount,
        getTransactions,
        getBanks
    };

    return (
        <walletContext.Provider value={value}>{children}</walletContext.Provider>
    );
};
