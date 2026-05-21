import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { globalStyles } from '../../styles/global';
import { authStyles } from '../../styles/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  function handleSend() {
    // integração firebase depois
    setSent(true);
  }

  if (sent) {
    return (
      <View style={globalStyles.container}>
        <Image
          source={require('../assets/genio_confiante.png')}
          style={authStyles.image}
          resizeMode="contain"
        />
        <Text style={globalStyles.title}>E-mail enviado!</Text>
        <Text style={authStyles.sentText}>
          Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
        </Text>
        <TouchableOpacity
          style={globalStyles.button}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={globalStyles.buttonText}>Voltar ao login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={globalStyles.container}>

      <Image
        source={require('../assets/genio_reflexivo.png')}
        style={authStyles.image}
        resizeMode="contain"
      />

      <Text style={globalStyles.title}>Esqueci minha senha</Text>

      <View style={authStyles.form}>
        <TextInput
          style={authStyles.input}
          placeholder="Digite seu e-mail"
          placeholderTextColor="#8d8d99"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <TouchableOpacity
        style={globalStyles.button}
        onPress={handleSend}
      >
        <Text style={globalStyles.buttonText}>Enviar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={authStyles.registerLink}
        onPress={() => router.push('/auth/login')}
      >
        <Text style={authStyles.registerLinkText}>
          Lembrei! <Text style={authStyles.registerLinkBold}>Voltar ao login</Text>
        </Text>
      </TouchableOpacity>

    </View>
  );
}