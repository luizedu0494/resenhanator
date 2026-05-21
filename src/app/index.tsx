import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { router } from 'expo-router';
import { globalStyles } from '../styles/global';
import { splashStyles } from '../styles/splash';

export default function Splash() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/onboarding');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={globalStyles.container}>
      <Image
        source={require('../assets/genio.png')}
        style={splashStyles.image}
        resizeMode="contain"
      />
      <Text style={globalStyles.title}>Resenhanator</Text>
      <Text style={splashStyles.subtitle}>Eu vou adivinhar quem você está pensando...</Text>
    </View>
  );
}