import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Image, ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { globalStyles, colors } from '../../styles/global';
import { gameStyles, guessStyles } from '../../styles/game';
import { getNextQuestion, GameState, isValidYesNoQuestion } from '../../services/groq';
import { GameButton } from '../../components/GameButton';
import { FeedbackButton } from '../../components/FeedbackButton';

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

const buttonRows: { label: string; type: 'sim' | 'nao' | 'talvez' | 'naosei' | 'provsim' | 'provnao' }[][] = [
  [
    { label: 'Sim',      type: 'sim'     },
    { label: 'Não',      type: 'nao'     },
  ],
  [
    { label: 'Talvez',   type: 'talvez'  },
    { label: 'Não sei',  type: 'naosei'  },
  ],
  [
    { label: 'Prov. sim', type: 'provsim' },
    { label: 'Prov. não', type: 'provnao' },
  ],
];

// ─── Logger centralizado ─────────────────────────────────────────────────────

const gameLog: string[] = [];
const gameStartTime = Date.now();

function log(tag: string, payload?: unknown) {
  const elapsed = ((Date.now() - gameStartTime) / 1000).toFixed(1);
  const line = `[${elapsed}s] [${tag}]${payload !== undefined ? ' ' + JSON.stringify(payload, null, 2) : ''}`;
  gameLog.push(line);
  console.log(line);
}

function printGameSummary(history: { question: string; answer: string }[], finalCharacter: string, won: boolean) {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║              RESUMO DA PARTIDA                       ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Personagem final : ${finalCharacter.padEnd(31)}║`);
  console.log(`║  Resultado        : ${(won ? '✅ IA ACERTOU' : '❌ IA ERROU').padEnd(31)}║`);
  console.log(`║  Total perguntas  : ${String(history.length).padEnd(31)}║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  history.forEach((h, i) => {
    const line = `${String(i + 1).padStart(2)}. [${h.answer.padEnd(8)}] ${h.question}`;
    console.log('║  ' + line.slice(0, 52).padEnd(52) + '║');
  });
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('\n');
}

// ─── Função para forçar chute via API quando character === '__FORCE_GUESS__' ──

async function forceGuessFromAPI(history: { question: string; answer: string }[]): Promise<string> {
  log('FORCE_GUESS', 'Limite atingido — chamando API para chute final');

  // Limpa o prefixo verboso que o modelo coloca nas perguntas e monta fatos diretos
  // Ex: "O personagem que você está pensando é brasileiro?" + "Sim" → "É brasileiro: Sim"
  const factsText = history
    .map(h => {
      const q = h.question
        .replace(/^O personagem que você está pensando é\s*/i, '')
        .replace(/^O personagem\s*/i, '')
        .replace(/\?$/, '')
        .trim();
      // Capitaliza primeira letra
      const qClean = q.charAt(0).toUpperCase() + q.slice(1);
      return `- ${qClean}: ${h.answer}`;
    })
    .join('\n');

  log('FORCE_GUESS_FACTS', factsText);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        max_tokens: 80,
        messages: [
          {
            role: 'system',
            content:
              'Você adivinha personagens famosos com base em características.\n' +
              'Responda SOMENTE com o nome completo do personagem. Zero explicações.\n' +
              'Exemplos: "Luciano Huck" | "Goku" | "Anitta" | "Silvio Santos"',
          },
          {
            role: 'user',
            content:
              `Características:\n${factsText}\n\n` +
              'Nome do personagem:',
          },
        ],
      }),
    });

    const data = await response.json();
    const raw  = (data.choices?.[0]?.message?.content ?? '').trim();
    log('FORCE_GUESS_RAW', { raw });

    // O modelo às vezes escreve raciocínio antes do nome ("Hebe não serve... então: Chico Xavier")
    // Estratégia: pega a última linha não vazia, que tende a ser o nome final
    const lines = raw.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const lastLine = lines[lines.length - 1] ?? '';

    const name = lastLine
      .replace(/^(Resposta|Nome|Personagem|então|portanto|logo|chuto|chute)[^a-zA-ZÀ-ú]*/i, '')
      .replace(/^["'`]|["'`]$/g, '')
      .replace(/\.$/g, '')
      .trim();

    log('FORCE_GUESS_RESULT', { name });
    return name || 'Não sei';
  } catch (err) {
    log('FORCE_GUESS_ERROR', String(err));
    return 'Não sei';
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Game() {
  const [question, setQuestion]       = useState('');
  const [reaction, setReaction]       = useState<GenieReaction>('neutro');
  const [loading, setLoading]         = useState(true);
  const [gameState, setGameState]     = useState<GameState>({ history: [] });
  const [questionNumber, setQuestionNumber] = useState(1);
  const [isGuess, setIsGuess]         = useState(false);
  const [character, setCharacter]     = useState('');
  const [feedback, setFeedback]       = useState<string | undefined>(undefined);

  // Ref para ter sempre o gameState atualizado dentro de closures assíncronas
  const gameStateRef = useRef<GameState>({ history: [] });

  useEffect(() => {
    log('GAME_START', { timestamp: new Date().toISOString() });
    fetchNextQuestion({ history: [] });
  }, []);

  async function fetchNextQuestion(state: GameState) {
    try {
      setLoading(true);
      setFeedback(undefined);
      log('API_REQUEST', { questionNumber: state.history.length + 1 });

      const result = await getNextQuestion(state);

      log('API_RESPONSE', {
        question: result.question,
        reaction: result.reaction,
        isGuess:  result.isGuess,
        character: result.character ?? null,
        feedback: result.feedback ?? null,
      });

      // ── Tratamento do __FORCE_GUESS__ ────────────────────────────────────────
      if (result.character === '__FORCE_GUESS__') {
        log('FORCE_GUESS_TRIGGERED', { atQuestion: state.history.length + 1 });
        const guessedName = await forceGuessFromAPI(state.history);

        setQuestion(`O personagem que você está pensando é ${guessedName}?`);
        setReaction('confiante');
        setIsGuess(true);
        setCharacter(guessedName);
        log('FORCE_GUESS_SET', { character: guessedName });
        return;
      }

      // Valida a pergunta gerada
      const isValidQuestion = isValidYesNoQuestion(result.question);
      if (!isValidQuestion) {
        log('INVALID_QUESTION_DETECTED', { question: result.question });
        setFeedback('invalid_question');
      }

      setQuestion(result.question);
      setReaction((result.reaction as GenieReaction) || 'neutro');
      setIsGuess(result.isGuess);
      if (result.character) setCharacter(result.character);
      if (result.feedback) setFeedback(result.feedback);

    } catch (err) {
      log('API_ERROR', String(err));
      setQuestion('Hmm, deixa eu pensar... O personagem é famoso?');
      setReaction('reflexivo');
    } finally {
      setLoading(false);
    }
  }

  async function handleAnswer(answer: string) {
    if (loading) return;

    log('PLAYER_ANSWER', { question, answer, questionNumber });

    const newHistory = [...gameState.history, { question, answer }];
    const newState   = { history: newHistory };
    setGameState(newState);
    gameStateRef.current = newState;
    setQuestionNumber(questionNumber + 1);

    if (isGuess) {
      const won = answer === 'Sim';
      printGameSummary(newHistory, character, won);

      router.push({
        pathname: '/game/result',
        params: {
          won:         won ? 'true' : 'false',
          character:   character ?? '',
          questions:   String(questionNumber),
          gameHistory: JSON.stringify(newHistory),
        },
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

      {/* ── Botão de Feedback (quando a IA faz pergunta composta) ────────────────── */}
      {feedback === 'invalid_question' && !loading && (
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <FeedbackButton 
            question={question}
            gameHistory={gameState.history}
            aiReaction={reaction}
            onFeedbackSent={() => {
              log('FEEDBACK_SENT', { question });
              setFeedback(undefined);
            }}
          />
        </View>
      )}

      <View style={gameStyles.buttonsContainer}>
        {isGuess ? (
          /* ── Modo chute: só Sim e Não, maiores e dramáticos ── */
          <View style={guessStyles.container}>
            <Text style={guessStyles.hint}>É esse?</Text>
            <View style={guessStyles.row}>
              <TouchableOpacity
                style={[guessStyles.btn, guessStyles.btnSim]}
                onPress={() => handleAnswer('Sim')}
                disabled={loading}
                activeOpacity={0.75}
              >
                <Text style={guessStyles.btnSymbol}>✓</Text>
                <Text style={guessStyles.btnLabel}>SIM!</Text>
                <Text style={guessStyles.btnSub}>Acertou!</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[guessStyles.btn, guessStyles.btnNao]}
                onPress={() => handleAnswer('Não')}
                disabled={loading}
                activeOpacity={0.75}
              >
                <Text style={guessStyles.btnSymbol}>✕</Text>
                <Text style={guessStyles.btnLabel}>NÃO</Text>
                <Text style={guessStyles.btnSub}>Errou...</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ── Modo pergunta: todos os botões normais ── */
          <>
            {buttonRows.map((row, rowIdx) => (
              <View key={rowIdx} style={gameStyles.buttonRow}>
                {row.map((btn) => (
                  <GameButton
                    key={btn.label}
                    label={btn.label}
                    type={btn.type}
                    onPress={() => handleAnswer(btn.label)}
                    disabled={loading}
                  />
                ))}
              </View>
            ))}
          </>
        )}
      </View>

    </View>
  );
}