import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors } from '../../src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleAlign: 'center',
        headerTitleStyle: { color: colors.primary, fontWeight: '800' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          height: 74,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="tree"
        options={{
          title: 'الشجرة',
          tabBarIcon: ({ color, size }) => <Ionicons name="git-network" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: 'المراجعة',
          tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="contribute"
        options={{
          title: 'مساهمة',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'المزيد',
          tabBarIcon: ({ color, size }) => <Ionicons name="ellipsis-horizontal-circle" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
