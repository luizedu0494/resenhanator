import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { globalStyles } from '../styles/global'; 
import { homeStyles } from '../styles/home';
import { router } from 'expo-router';

export default function Home() {
  return (
    <View style={globalStyles.container}>
        
         <View>
            <Image
                source={require('../assets/genio.png')}
                style={homeStyles.image}
            />
        </View>
        
        <Text style={globalStyles.title}>Resenhanator</Text>

        <TouchableOpacity style={globalStyles.button} onPress={() => router.push("/game")}>
            <Text style={globalStyles.buttonText}>Começar Jogo</Text>
        </TouchableOpacity>
    </View>
  );
}