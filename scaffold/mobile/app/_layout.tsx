import { Stack } from 'expo-router';
import { I18nManager, StatusBar } from 'react-native';

import { colors } from '../src/theme';

I18nManager.allowRTL(true);

export default function RootLayout() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerBackTitle: 'رجوع',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="person/[id]" options={{ title: 'تفاصيل النسب', presentation: 'card' }} />
      </Stack>
    </>
  );
}
