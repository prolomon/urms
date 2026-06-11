import { useEffect } from "react";
import { AuthProvider } from "@/hooks/use-auth";
import { ToastProvider } from "@/hooks/use-toast";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { WalletProvider } from "@/hooks/use-wallet";
import * as SplashScreen from "expo-splash-screen";
import { ObserveRoot, useObserve } from "expo-observe";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayout() {
  const { markInteractive } = useObserve();

  useEffect(() => {
    SplashScreen.hide();
    markInteractive();
  }, [markInteractive]);

  return (
    <ThemeProvider value={DefaultTheme}>
      <AuthProvider>
        <WalletProvider>
          <ToastProvider>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="receipt" options={{ headerShown: false }} />
              <Stack.Screen
                name="notification"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="payment" options={{ headerShown: false }} />
              <Stack.Screen name="complete" options={{ headerShown: false }} />
              <Stack.Screen name="transfer" options={{ headerShown: false }} />
              <Stack.Screen
                name="transaction"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="agent" options={{ headerShown: false }} />
              <Stack.Screen name="(pages)" options={{ headerShown: false }} />
              <Stack.Screen
                name="modal"
                options={{ presentation: "modal", title: "Modal" }}
              />
            </Stack>
            <StatusBar style="auto" />
          </ToastProvider>
        </WalletProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default ObserveRoot.wrap(RootLayout);
