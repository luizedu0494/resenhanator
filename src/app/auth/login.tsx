import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { globalStyles } from '../../styles/global';
import { authStyles } from '../../styles/auth';
import { login, loginWithGoogle } from '../../services/auth';

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleLogin(id_token);
    }
  }, [response]);

  async function handleGoogleLogin(idToken: string) {
    try {
      setLoading(true);
      await loginWithGoogle(idToken);
      router.push('/home');
    } catch (err) {
      setError('Erro ao entrar com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setError('');
    if (!email || !password) {
      setError('Preencha todos os campos.');
      return;
    }
    try {
      setLoading(true);
      await login(email, password);
      router.push('/home');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/invalid-email') {
        setError('E-mail inválido.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        setError('Erro ao entrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
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

        {error ? <Text style={authStyles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={authStyles.forgotPassword}
          onPress={() => router.push('/auth/forgot')}
        >
          <Text style={authStyles.forgotPasswordText}>Esqueci minha senha</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={globalStyles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={globalStyles.buttonText}>Entrar</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity
        style={authStyles.googleButton}
        onPress={() => promptAsync()}
        disabled={!request || loading}
      >
        <Text style={authStyles.googleButtonText}>Entrar com Google</Text>
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