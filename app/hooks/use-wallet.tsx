"use client";
import { AUTH_MEMBER, AUTH_MEMBER_TOKEN, AUTH_MEMBER_WALLET, AUTH_MEMBER_WALLET_STATE } from "@/lib/api";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getWallet, createWallet, initiateTransfer, resolveBankAccount, getBanks, getTransactions } from "@/lib/services/wallet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Wallet } from "@/lib/types";

const walletContext = createContext<any>(null);

export const useWallet = () => {
    const context = useContext(walletContext);
    if (!context) {
        throw new Error("useWallet must be used within an WalletProvider");
    }
    return context;
};

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [isWallet, setIsWallet] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [uid, setUid] = useState<string | null>(null);
    const [token, setToken] = useState<string | undefined>(undefined);
    const [hide, setHide] = useState(false);

    const toggleHide = async (toggle: boolean) => {
        if (toggle) {
            await AsyncStorage.setItem(AUTH_MEMBER_WALLET_STATE, JSON.stringify({ hidden: false }));
            setHide(false);
        } else {
            await AsyncStorage.setItem(AUTH_MEMBER_WALLET_STATE, JSON.stringify({ hidden: true }));
            setHide(true);
        }
    }

    // Get CustomerCode from session storage on initial load
    useEffect(() => {
        (async () => {
            const adminData = await AsyncStorage.getItem(AUTH_MEMBER);

            if (adminData) {
                const parsedAdmin = JSON.parse(adminData);
                setUid(parsedAdmin.uid ?? null);
            } else {
                setUid(null);
            }

            const tok = await AsyncStorage.getItem(AUTH_MEMBER_TOKEN);

            const walletState = (await AsyncStorage.getItem(AUTH_MEMBER_WALLET_STATE)) ? JSON.parse(await AsyncStorage.getItem(AUTH_MEMBER_WALLET_STATE) as string) : null;

            if (walletState) {
                setHide(walletState?.hidden);
            }

            if (tok) {
                setToken(tok);
            }
        })()
    }, []);

    // Fetch wallet data when customerCode is available
    const fetchWallet = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (!uid) {
                setIsWallet(false);
                setWallet(null);
                setMessage("No customer code found for this account.");
                return;
            }

            const { ok, wallet, message } = await getWallet(uid, "AGENT", token as string);

            if (ok && wallet) {
                setIsWallet(true);
                setWallet(wallet);
            } else {
                setIsWallet(false);
                setWallet(null);
            }

            setMessage(message || null);

        } catch (error) {
            setIsWallet(false);
            setError(error instanceof Error ? error : new Error("Unknown error"));
        } finally {
            setLoading(false);
        }

    }, [token, uid]);

    useEffect(() => {
        fetchWallet();
    }, [fetchWallet]);

    const refresh = useCallback(() => {
        fetchWallet();
    }, [fetchWallet]);

    const value = {
        toggleHide,
        hide,
        wallet,
        isWallet,
        loading,
        error,
        message,
        refresh,
        setUid,
        initiateTransfer,
        resolveBankAccount,
        getBanks,
        getTransactions,
        createWallet
    };

    return (
        <walletContext.Provider value={value}>{children}</walletContext.Provider>
    );
};
