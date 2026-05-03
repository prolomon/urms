"use client";
import { AUTH_AGENT, AUTH_AGENT_TOKEN, AUTH_AGENT_WALLET, AUTH_AGENT_WALLET_STATE } from "@/lib/api";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getWallet, createWallet, createRecipient, initiateTransfer, resolveBankAccount, validateWallet } from "@/lib/services/wallet";
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
    const [customerCode, setCustomerCode] = useState<string | null>(null);
    const [uid, setUid] = useState<string | null>(null);
    const [token, setToken] = useState<string | undefined>(undefined);
    const [hide, setHide] = useState(false); 

    const toggleHide = async (toggle: boolean) => {
        if (toggle) {
            await AsyncStorage.setItem(AUTH_AGENT_WALLET_STATE, JSON.stringify({ hidden: false }));
            setHide(false);
        } else {
            await AsyncStorage.setItem(AUTH_AGENT_WALLET_STATE, JSON.stringify({ hidden: true }));
            setHide(true);
        }   
    }

    // Get CustomerCode from session storage on initial load
    useEffect(() => {
        (async () => {
            const adminData = await AsyncStorage.getItem(AUTH_AGENT);

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
 
            const tok = await AsyncStorage.getItem(AUTH_AGENT_TOKEN);

            const walletState = (await AsyncStorage.getItem(AUTH_AGENT_WALLET_STATE)) ? JSON.parse(await AsyncStorage.getItem(AUTH_AGENT_WALLET_STATE) as string) : null;

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
            if (!customerCode || !uid) {
                setIsWallet(false);
                setWallet(null);
                setMessage("No customer code found for this account.");
                return;
            }

            const { ok, wallet, message, isExist } = await getWallet(uid, token as string);

            if (isExist) {
                if (ok && wallet) {
                    setIsWallet(true);
                    setWallet(wallet);
                } else { 
                    setIsWallet(false);
                    setWallet(null);
                } 
            } else {
                await createWallet(customerCode, uid, "agent", token as string);

                const created = await getWallet(uid, token as string);
                if (created.ok && created.wallet) {
                    setIsWallet(true);
                    await AsyncStorage.setItem(AUTH_AGENT_WALLET, JSON.stringify(created.wallet));
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
            setIsWallet(false);
            setError(error instanceof Error ? error : new Error("Unknown error"));
        } finally {
            setLoading(false);
        }

    }, [customerCode, token, uid]);

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
