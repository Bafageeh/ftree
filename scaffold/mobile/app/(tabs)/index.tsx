import { Redirect } from 'expo-router';

export default function RemovedHomeScreen() {
  return <Redirect href="/(tabs)/tree" />;
}
