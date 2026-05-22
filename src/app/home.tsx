import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  FlatList, ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { globalStyles, colors } from '../styles/global';
import { homeStyles } from '../styles/home';
import { router } from 'expo-router';
import { loadHistory, HistoryEntry } from '../services/history';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function Home() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Recarrega sempre que a tela ganhar foco (ex: voltando do jogo)
  useFocusEffect(
    useCallback(() => {
      loadHistory().then(setHistory);
    }, [])
  );

  const wins  = history.filter(h => h.won).length;
  const losses = history.filter(h => !h.won).length;

  return (
    <ScrollView
      contentContainerStyle={homeStyles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Image
        source={require('../assets/genio.png')}
        style={homeStyles.image}
      />

      <Text style={globalStyles.title}>Resenhanator</Text>

      <TouchableOpacity style={globalStyles.button} onPress={() => router.push('/game')}>
        <Text style={globalStyles.buttonText}>Começar Jogo</Text>
      </TouchableOpacity>

      {/* Histórico */}
      {history.length > 0 && (
        <View style={homeStyles.historySection}>

          {/* Placar resumido */}
          <View style={homeStyles.scoreboard}>
            <View style={homeStyles.scoreItem}>
              <Text style={homeStyles.scoreNumber}>{wins}</Text>
              <Text style={homeStyles.scoreLabel}>vitórias</Text>
            </View>
            <View style={homeStyles.scoreDivider} />
            <View style={homeStyles.scoreItem}>
              <Text style={[homeStyles.scoreNumber, homeStyles.scoreNumberLoss]}>{losses}</Text>
              <Text style={homeStyles.scoreLabel}>derrotas</Text>
            </View>
          </View>

          <Text style={homeStyles.historyTitle}>Últimas partidas</Text>

          {history.map((item) => (
            <View key={item.id} style={homeStyles.historyRow}>
              <View style={[homeStyles.badge, item.won ? homeStyles.badgeWon : homeStyles.badgeLost]}>
                <Text style={homeStyles.badgeText}>{item.won ? '✓' : '✕'}</Text>
              </View>
              <View style={homeStyles.historyInfo}>
                <Text style={homeStyles.historyCharacter}>
                  {item.won
                    ? item.character
                    : item.revealedCharacter
                      ? `${item.revealedCharacter} (chutei: ${item.character})`
                      : item.character}
                </Text>
                <Text style={homeStyles.historyMeta}>
                  {item.questions} perguntas · {formatDate(item.date)}
                </Text>
              </View>
            </View>
          ))}

        </View>
      )}
    </ScrollView>
  );
}