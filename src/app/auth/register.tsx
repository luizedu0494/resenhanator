import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { globalStyles } from '../../styles/global';
import { authStyles } from '../../styles/auth';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  function handleRegister() {
    // integração firebase depois
    router.push('/home');
  }

  return (
    <View style={globalStyles.container}>

      <Image
        source={require('../../assets/genio_confiante.png')}
        style={authStyles.image}
        resizeMode="contain"
      />

      <Text style={globalStyles.title}>Criar conta</Text>

      <View style={authStyles.form}>
        <TextInput
          style={authStyles.input}
          placeholder="Nome"
          placeholderTextColor="#8d8d99"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
        />

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

        <TextInput
          style={authStyles.input}
          placeholder="Confirmar senha"
          placeholderTextColor="#8d8d99"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      </View>

      <TouchableOpacity
        style={globalStyles.button}
        onPress={handleRegister}
      >
        <Text style={globalStyles.buttonText}>Cadastrar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={authStyles.registerLink}
        onPress={() => router.push('/auth/login')}
      >
        <Text style={authStyles.registerLinkText}>
          Já tem conta? <Text style={authStyles.registerLinkBold}>Entrar</Text>
        </Text>
      </TouchableOpacity>

    </View>
  );
}