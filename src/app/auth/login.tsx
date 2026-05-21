import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { globalStyles } from '../../styles/global';
import { authStyles } from '../../styles/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleLogin() {
    // integração firebase depois
    router.push('/home');
  }

  return (
    <View style={globalStyles.container}>

      <Image
        source={require('../assets/genio_confiante.png')}
        style={authStyles.image}
        resizeMode="contain"
      />

      <Text style={globalStyles.title}>Entrar</Text>

      <View style={authStyles.form}>
        <TextInput
          style={authStyles.input}
          placeholder="E-mail"
          placeholderTextColor="#8d8d99"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={authStyles.input}
          placeholder="Senha"
          placeholderTextColor="#8d8d99"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={authStyles.forgotPassword}>
          <Text style={authStyles.forgotPasswordText}>Esqueci minha senha</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={globalStyles.button}
        onPress={handleLogin}
      >
        <Text style={globalStyles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={authStyles.registerLink}
        onPress={() => router.push('/auth/register')}
      >
        <Text style={authStyles.registerLinkText}>
          Não tem conta? <Text style={authStyles.registerLinkBold}>Cadastre-se</Text>
        </Text>
      </TouchableOpacity>

    </View>
  );
}