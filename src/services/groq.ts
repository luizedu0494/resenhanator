import { loadAiMemory } from './history';

export interface GameState {
  history: { question: string; answer: string }[];
}

export async function getNextQuestion(gameState: GameState): Promise<{
  question: string;
  reaction: string;
  isGuess: boolean;
  character?: string;
}> {
  const questionNumber = gameState.history.length + 1;

  // Histórico formatado com numeração clara
  const historyText = gameState.history
    .map((h, i) => `${i + 1}. P: "${h.question}" → R: ${h.answer}`)
    .join('\n');

  // Perguntas já feitas — para reforçar explicitamente no prompt
  const askedQuestions = gameState.history.map(h => `"${h.question}"`).join(', ');

  // Memória própria da IA
  const memory          = await loadAiMemory();
  const neverRepeat     = memory.map(m => m.character);
  const playerLikes     = memory.filter(m => !m.wasGuessed).map(m => m.character);
  const aiGuessed       = memory.filter(m => m.wasGuessed).map(m => m.character);

  const neverRepeatCtx = neverRepeat.length > 0
    ? `\nNUNCA CHUTE ESTES personagens (já foram jogados): ${neverRepeat.join(', ')}.`
    : '';
  const playerProfileCtx = playerLikes.length > 0
    ? `\nPERFIL DO JOGADOR (personagens que ele pensa): ${playerLikes.join(', ')}.`
    : '';
  const aiStrengthCtx = aiGuessed.length > 0
    ? `\nA IA já acertou: ${aiGuessed.slice(0, 15).join(', ')}. Explore novas categorias.`
    : '';

  const askedCtx = askedQuestions
    ? `\n\n🚫 PERGUNTAS JÁ FEITAS NESTA PARTIDA — PROIBIDO REPETIR:\n${askedQuestions}\nA próxima pergunta DEVE SER DIFERENTE de todas as acima.`
    : '';

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: `Você é o Resenhanator, um gênio arrogante e divertido que tenta adivinhar personagens.
Você está na pergunta número ${questionNumber}.${neverRepeatCtx}${playerProfileCtx}${aiStrengthCtx}${askedCtx}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRA DE OURO — NUNCA VIOLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Toda pergunta deve ser respondível com SIM ou NÃO.
✓ "É brasileiro?" ✓ "Ficou famoso após 2010?" ✓ "É da Marvel?"
✗ "É de qual país?" ✗ "Qual área?" ✗ "É de filme ou série?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRA DE DEDUÇÃO IMEDIATA — PRIORIDADE 1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Se as respostas já identificam UM ÚNICO personagem possível, CHUTE IMEDIATAMENTE sem mais perguntas.
- Fictício + anime + Dragon Ball + protagonista = Goku → CHUTE JÁ
- Fictício + Marvel + deus nórdico + martelo = Thor → CHUTE JÁ
- Real + Brasil + futebol + aposentado + "Fenômeno" = Ronaldo → CHUTE JÁ
- Real + música + Brasil + funk + muito famosa = Anitta → CHUTE JÁ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FLUXO — SIGA ESTA ORDEM (se ainda não perguntou)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Perg 1 → "É uma pessoa real?" (SE JÁ PERGUNTOU, NUNCA REPITA)

SE REAL:
  → Gênero, nacionalidade, se ainda vivo, geração (antes/depois 2000)
  → Área: atleta / músico / ator / político
  → Subárea específica da área confirmada
  → Traços marcantes: apelido, polêmica, seguidores, prêmios
  → Perg 13+: CHUTE

SE FICTÍCIO:
  → Super-herói/vilão?
  → Universo: Marvel / DC / anime / videogame / série
  → Universo exato (Dragon Ball? Naruto? Marvel?)
  → Protagonista? Poderes? Item marcante? Herói ou vilão?
  → Perg 10+: CHUTE

━━━━━━━━━━━━━━━━━━━━━
LIMITES ANTI-TRAVAMENTO
━━━━━━━━━━━━━━━━━━━━━
- Máximo 2 perguntas por subárea, depois chuta
- ${questionNumber > 17 ? '🚨 CHUTE AGORA, obrigatório!' : questionNumber > 13 ? '⚠️ Chute já!' : questionNumber > 8 ? 'Prepare o chute.' : 'Mapeie e aprofunde.'}

━━━━━━━━━━━━━━━━
FORMATO DE SAÍDA
━━━━━━━━━━━━━━━━
Responda APENAS JSON válido, sem markdown, sem texto antes ou depois:

Pergunta: {"question":"...","reaction":"neutro|concentrado|confiante|desesperado|despeitado|esnobe|inquieto|irritado|reflexivo","isGuess":false}
Chute:    {"question":"O personagem que você está pensando é [nome]?","reaction":"confiante","isGuess":true,"character":"[nome]"}`,
        },
        {
          role: 'user',
          content: historyText
            ? `Histórico desta partida (${questionNumber - 1} perguntas já feitas):\n${historyText}\n\nAgora faça a pergunta de número ${questionNumber}. NÃO repita nenhuma pergunta do histórico acima.`
            : 'Comece o jogo com a pergunta 1.',
        },
      ],
    }),
  });

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || '';

  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    // Validação básica: se retornou a mesma pergunta já feita, força um chute genérico
    const alreadyAsked = gameState.history.some(
      h => h.question.trim().toLowerCase() === (parsed.question || '').trim().toLowerCase()
    );
    if (alreadyAsked) {
      return { question: 'Já tenho pistas suficientes... Vou arriscar!', reaction: 'confiante', isGuess: false };
    }
    return parsed;
  } catch {
    // Fallback nunca repete "É uma pessoa real?" — usa pergunta genérica segura
    const fallbacks = [
      { question: 'O personagem ficou famoso depois dos anos 2000?', reaction: 'reflexivo', isGuess: false },
      { question: 'É um personagem do entretenimento (música, cinema ou esporte)?', reaction: 'concentrado', isGuess: false },
      { question: 'Essa pessoa ou personagem é conhecido mundialmente?', reaction: 'inquieto', isGuess: false },
    ];
    return fallbacks[questionNumber % fallbacks.length];
  }
}