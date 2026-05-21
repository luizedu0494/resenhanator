// src/app/game/_layout.tsx
import { Stack } from 'expo-router';

export default function GameLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}