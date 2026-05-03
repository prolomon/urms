import { Stack } from 'expo-router';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {

  return (
      <Stack>
        <Stack.Screen name="[id]" options={{ headerShown: false }} />
      </Stack>
  );
}
