import React, { useState, useEffect } from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { globalStyles, colors } from '../../styles/global';
import { gameStyles } from '../../styles/game';
import { getNextQuestion, GameState } from '../../services/groq';
import { GameButton } from '../../components/GameButton';

const genieImages = {
  neutro:      require('../../assets/genio_neutro.png'),
  concentrado: require('../../assets/genio_concentrado.png'),
  confiante:   require('../../assets/genio_confiante.png'),
  desesperado: require('../../assets/genio_desesperado.png'),
  despeitado:  require('../../assets/genio_despeitado.png'),
  esnobe:      require('../../assets/genio_esnobe.png'),
  inquieto:    require('../../assets/genio_inquieto.png'),
  irritado:    require('../../assets/genio_irritado.png'),
  reflexivo:   require('../../assets/genio_reflexivo.png'),
} as const;

type GenieReaction = keyof typeof genieImages;

const buttons: { label: string; type: 'sim' | 'nao' | 'talvez' | 'naosei' | 'provsim' | 'provnao' }[] = [
  { label: 'Sim',               type: 'sim'     },
  { label: 'Não',               type: 'nao'     },
  { label: 'Talvez',            type: 'talvez'  },
  { label: 'Não sei',           type: 'naosei'  },
  { label: 'Provavelmente sim', type: 'provsim' },
  { label: 'Provavelmente não', type: 'provnao' },
];

export default function Game() {
  const [question, setQuestion] = useState('');
  const [reaction, setReaction] = useState<GenieReaction>('neutro');
  const [loading, setLoading] = useState(true);
  const [gameState, setGameState] = useState<GameState>({ history: [] });
  const [questionNumber, setQuestionNumber] = useState(1);
  const [isGuess, setIsGuess] = useState(false);
  const [character, setCharacter] = useState('');

  useEffect(() => {
    fetchNextQuestion({ history: [] });
  }, []);

  async function fetchNextQuestion(state: GameState) {
    try {
      setLoading(true);
      const result = await getNextQuestion(state);
      setQuestion(result.question);
      setReaction((result.reaction as GenieReaction) || 'neutro');
      setIsGuess(result.isGuess);
      if (result.character) setCharacter(result.character);
    } catch (err) {
    console.log('ERRO GROQ:', err); 
    setQuestion('Hmm, deixa eu pensar... O personagem é famoso?');
    setReaction('reflexivo');
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswer(answer: string) {
    if (loading) return;

    const newHistory = [...gameState.history, { question, answer }];
    const newState = { history: newHistory };
    setGameState(newState);
    setQuestionNumber(questionNumber + 1);

    if (isGuess) {
      router.push({
        pathname: '/game/result',
        params: { won: answer === 'Sim' ? 'true' : 'false', character },
      });
      return;
    }

    await fetchNextQuestion(newState);
  }

  return (
    <View style={globalStyles.container}>

      <View style={gameStyles.characterContainer}>
        {loading ? (
          <View style={gameStyles.loadingContainer}>
            <Image
              source={genieImages.reflexivo}
              style={gameStyles.image}
              resizeMode="contain"
            />
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={gameStyles.loadingIndicator}
            />
          </View>
        ) : (
          <Image
            source={genieImages[reaction]}
            style={gameStyles.image}
            resizeMode="contain"
          />
        )}

        {!loading && (
          <View style={gameStyles.bubble}>
            <Text style={gameStyles.bubbleText}>{question}</Text>
            <View style={gameStyles.arrowRight} />
          </View>
        )}
      </View>

      <Text style={gameStyles.counter}>Pergunta {questionNumber}</Text>

      <View style={gameStyles.buttonsContainer}>
        {buttons.map((btn) => (
          <GameButton
            key={btn.label}
            label={btn.label}
            type={btn.type}
            onPress={() => handleAnswer(btn.label)}
            disabled={loading}
          />
        ))}
      </View>

    </View>
  );
}