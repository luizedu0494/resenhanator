/**
 * groq.ts — Resenhanator AI
 * Limite: 20 perguntas. Cobre todo tipo de entretenimento e profissão famosa.
 */

import { loadAiMemory } from './history';
import { getTopQuestions } from './aiKnowledge';
import { getRecentInvalidQuestionFeedback } from './feedbackService';

export interface GameState {
  history: { question: string; answer: string }[];
}

function normQ(q: string) {
  return q.toLowerCase().trim().replace(/\?+$/, '').trim();
}

// Utilitário para sortear um item de um array
function getRandomItem<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function inferCategory(
  history: { question: string; answer: string }[]
): 'real' | 'ficticio' | null {
  for (const h of history) {
    const q = h.question.toLowerCase();
    const a = h.answer;
    if (q.includes('pessoa real') && (a === 'Sim' || a === 'Prov. sim')) return 'real';
    if (q.includes('pessoa real') && (a === 'Não'  || a === 'Prov. não')) return 'ficticio';
  }
  return null;
}

export function isValidYesNoQuestion(question: string): boolean {
  const q = question.toLowerCase().trim();
  const invalidPatterns = [
    /^qual\s/i, /^quem\s/i, /^onde\s/i, /^quando\s/i,
    /^quanto\s/i, /^como\s/i, /^por que|^porque/i,
    /de qual\s+(país|série|universo|editora)/i,
    /\b(filme|série|anime|videogame|quadrinho|editora|país|estado|cidade)\b.{1,20}\bou\b.{1,20}\b(filme|série|anime|videogame|quadrinho|editora|país|estado|cidade)\b/i,
    /\b(músico|ator|atleta|político|cantor|apresentador)\b.{1,15}\bou\b.{1,15}\b(músico|ator|atleta|político|cantor|apresentador)\b/i,
  ];
  return !invalidPatterns.some(p => p.test(q));
}

export async function getNextQuestion(gameState: GameState): Promise<{
  question: string;
  reaction: string;
  isGuess: boolean;
  character?: string;
  feedback?: string;
}> {
  const questionNumber = gameState.history.length + 1;
  const askedSet = new Set(gameState.history.map(h => normQ(h.question)));

  if (questionNumber === 1) {
    return { question: 'É uma pessoa real?', reaction: 'neutro', isGuess: false };
  }

  if (questionNumber > 20) {
    return {
      question: 'Já tenho pistas suficientes. Vou arriscar meu melhor chute!',
      reaction: 'confiante', isGuess: true, character: '__FORCE_GUESS__',
    };
  }

  const [memory, topQuestions, recentFeedback] = await Promise.all([
    loadAiMemory(),
    getTopQuestions(15),
    getRecentInvalidQuestionFeedback(10),
  ]);

  // ─── NOVO: Lógica de Personagens Frequentes (Aprendizado) ───
  // Pega os 10 personagens com maior "count" (mais jogados)
  const frequentCharacters = memory
    .sort((a: any, b: any) => (b.count || 1) - (a.count || 1))
    .slice(0, 10)
    .map(m => m.character);

  const category = inferCategory(gameState.history);

  const confirmedYes = (kw: string) => gameState.history.some(h => {
    const q = h.question.toLowerCase();
    if (kw === 'anime' && (q.includes('não anime') || q.includes('não é anime'))) return false;
    return q.includes(kw) && (h.answer === 'Sim' || h.answer === 'Prov. sim');
  });

  const alreadyAsked = (kw: string) => gameState.history.some(h =>
    h.question.toLowerCase().includes(kw));

  const isAnime    = confirmedYes('anime');
  const isManga    = confirmedYes('mangá') || confirmedYes('manga');
  const isManhua   = confirmedYes('manhwa') || confirmedYes('manhua') || confirmedYes('webtoon');
  const isCartoon  = confirmedYes('cartoon') || confirmedYes('desenho animado') || confirmedYes('animação ocidental');
  const isGame     = confirmedYes('videogame') || confirmedYes('jogo');
  const isMarvel   = confirmedYes('marvel');
  const isDC       = confirmedYes('dc comics');
  const isSerie    = confirmedYes('série de tv') || confirmedYes('serie de tv');
  const isFilme    = confirmedYes('filme') && !isAnime && !isCartoon && !isManga;
  const isDisney   = confirmedYes('disney') || confirmedYes('pixar');
  const isLivro    = confirmedYes('livro') || confirmedYes('literatura') || confirmedYes('romance literário');
  const isHQ       = confirmedYes('quadrinho') || confirmedYes('hq') || confirmedYes('comics');
  const isTeatro   = confirmedYes('teatro') || confirmedYes('musical');
  const isMito     = confirmedYes('mitologia') || confirmedYes('lendário') || confirmedYes('folclore');

  let ficticioPath = '';
  if (category === 'ficticio') {
    if (isAnime || isManga) {
      ficticioPath = `
🎌 CONFIRMADO: Anime/Mangá.
Caminho: qual série? → protagonista? → CARACTERÍSTICAS (cor do cabelo? usa espada? tem cicatriz? usa magia? usa uniforme?) → CHUTE.`;
    } else if (isCartoon) {
      ficticioPath = `
📺 CONFIRMADO: Cartoon/Animação Ocidental.
Caminho: estúdio/emissora? → CARACTERÍSTICAS (é um animal? é verde/amarelo? usa chapéu? é criança? vive debaixo d'água? é super-herói?) → CHUTE.`;
    } else if (isGame) {
      ficticioPath = `
🎮 CONFIRMADO: Videogame.
Caminho: franquia? → CARACTERÍSTICAS (usa armadura? arma de fogo? tem bigode? é um animal? salva princesa?) → CHUTE.`;
    } else if (isMarvel || isDC) {
      ficticioPath = `
🦸 CONFIRMADO: Heróis (Marvel/DC).
Caminho: herói ou vilão? → CARACTERÍSTICAS (voa? usa capa? armadura de metal? mutante/alienígena? cor do traje principal?) → CHUTE.`;
    } else {
      const universosDisponiveis = [
        { kw: 'anime',             q: 'É de um anime?' },
        { kw: 'cartoon',           q: 'É um cartoon ou animação ocidental?' },
        { kw: 'videogame',         q: 'É de um videogame?' },
        { kw: 'marvel',            q: 'É da Marvel?' },
        { kw: 'dc comics',         q: 'É da DC Comics?' },
        { kw: 'disney',            q: 'É da Disney ou Pixar?' },
        { kw: 'série de tv',       q: 'É de uma série de TV (live-action)?' },
        { kw: 'filme',             q: 'É de um filme (não animado)?' },
      ].filter(u => !alreadyAsked(u.kw));

      const universoSorteado = getRandomItem(universosDisponiveis);

      ficticioPath = universoSorteado
        ? `\n🗺️ Universo ainda desconhecido. Próxima sugerida: "${universoSorteado.q}"`
        : '\n🗺️ Universo já explorado. Aprofunde CARACTERÍSTICAS FÍSICAS e CHUTE.';
    }
  }

  const categoryCtx = category === 'real'
    ? `\n✅ PESSOA REAL. Aprofunde com características físicas marcantes (barba, careca, óculos, tatuagem, cabelo loiro) e área de atuação.`
    : category === 'ficticio'
    ? `\n✅ FICTÍCIO.${ficticioPath}`
    : '\n⚠️ Ainda não confirmou real ou fictício.';

  const askedCtx = gameState.history.length > 0
    ? `\n\n🚫 JÁ PERGUNTADO:\n${gameState.history.map((h, i) => `${i + 1}. "${h.question}" → ${h.answer}`).join('\n')}`
    : '';

  const frequentCtx = frequentCharacters.length > 0 
    ? `\n🧠 PERSONAGENS POPULARES (Considere chutar esses se os traços baterem): ${frequentCharacters.join(', ')}.` 
    : '';

  const feedbackCtx = recentFeedback.length > 0
    ? `\n\n⚠️ ERROS RECENTES (Evite estas perguntas inválidas):\n` + recentFeedback.map(f => `- "${f.question}"`).join('\n')
    : '';

  const historyText = gameState.history.map((h, i) => `${i + 1}. P: "${h.question}" → R: ${h.answer}`).join('\n');

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 250,
        messages: [
          {
            role: 'system',
            content:
  `Você é o Resenhanator. Pergunta ${questionNumber}/20.
  ${categoryCtx}${frequentCtx}${askedCtx}${feedbackCtx}
  
  ━━━ REGRA DE OURO ━━━
  Toda pergunta DEVE ser SIM ou NÃO.
  DÊ PRIORIDADE MÁXIMA a perguntas sobre CARACTERÍSTICAS VISUAIS (cor, roupa, acessórios, espécie) a partir da pergunta 5.
  
  ━━━ SAÍDA ━━━
  APENAS JSON válido, sem markdown:
  {"question":"...","reaction":"neutro|concentrado|confiante|inquieto|reflexivo","isGuess":false}`
          },
          { role: 'user', content: `Histórico:\n${historyText}\n\nFaça a pergunta ${questionNumber}.` },
        ],
      }),
    });

    const data = await response.json();
    const raw  = data.choices?.[0]?.message?.content || '';
    
    let parsed: any = null;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {}

    if (parsed && isValidYesNoQuestion(parsed.question) && !askedSet.has(normQ(parsed.question))) {
      return parsed;
    }
  } catch (err) {
    // Se a API falhar, cai pros fallbacks
  }

  // ─── LÓGICA DE EXCLUSÃO MÚTUA PARA FALLBACKS ───
  const hasCartoonStudio = confirmedYes('nickelodeon') || confirmedYes('cartoon network') || confirmedYes('hanna-barbera') || confirmedYes('fox');
  const hasAnimeSeries = confirmedYes('dragon ball') || confirmedYes('naruto') || confirmedYes('one piece') || confirmedYes('demon slayer');

  const fallbacksReal = [
    { question: 'A pessoa é careca?', reaction: 'concentrado', isGuess: false },
    { question: 'Usa óculos com frequência?', reaction: 'reflexivo', isGuess: false },
    { question: 'Tem barba ou cavanhaque?', reaction: 'inquieto', isGuess: false },
    { question: 'Tem o cabelo loiro?', reaction: 'concentrado', isGuess: false },
    { question: 'É conhecido(a) por ter muitas tatuagens?', reaction: 'reflexivo', isGuess: false },
    { question: 'É um homem idoso (mais de 60 anos)?', reaction: 'inquieto', isGuess: false },
    { question: 'Costuma usar chapéu, boné ou touca?', reaction: 'concentrado', isGuess: false },
    { question: 'Sua profissão envolve esportes com bola?', reaction: 'reflexivo', isGuess: false },
    { question: 'Toca algum instrumento musical?', reaction: 'inquieto', isGuess: false },
    { question: 'Apresenta programas de auditório?', reaction: 'concentrado', isGuess: false },
  ];

  let fallbacksCartoon = [
    ...(!hasCartoonStudio ? [
      { question: 'É da Nickelodeon?', reaction: 'concentrado', isGuess: false },
      { question: 'É do Cartoon Network?', reaction: 'reflexivo', isGuess: false },
      { question: 'É da Hanna-Barbera (Scooby-Doo, Flintstones)?', reaction: 'inquieto', isGuess: false },
    ] : []),
    { question: 'O personagem é um animal (cachorro, urso, rato, etc)?', reaction: 'inquieto', isGuess: false },
    { question: 'Vive debaixo d\'água?', reaction: 'reflexivo', isGuess: false },
    { question: 'O personagem tem a pele amarela?', reaction: 'concentrado', isGuess: false },
    { question: 'O personagem tem a pele verde?', reaction: 'reflexivo', isGuess: false },
    { question: 'O personagem é uma criança?', reaction: 'inquieto', isGuess: false },
    { question: 'Usa capa ou roupa de super-herói?', reaction: 'concentrado', isGuess: false },
    { question: 'Tem poderes ligados a fogo, água ou terra?', reaction: 'reflexivo', isGuess: false },
    { question: 'Usa óculos?', reaction: 'inquieto', isGuess: false },
    { question: 'É conhecido por ser muito burro ou atrapalhado?', reaction: 'concentrado', isGuess: false },
    { question: 'O personagem é um robô ou máquina?', reaction: 'reflexivo', isGuess: false },
  ];

  let fallbacksAnime = [
    ...(!hasAnimeSeries ? [
      { question: 'É do Dragon Ball?', reaction: 'concentrado', isGuess: false },
      { question: 'É do Naruto?', reaction: 'reflexivo', isGuess: false },
      { question: 'É do One Piece?', reaction: 'inquieto', isGuess: false },
    ] : []),
    { question: 'Usa uma espada ou katana principal?', reaction: 'inquieto', isGuess: false },
    { question: 'O personagem tem cabelo branco ou prateado?', reaction: 'reflexivo', isGuess: false },
    { question: 'O personagem tem cabelo rosa?', reaction: 'concentrado', isGuess: false },
    { question: 'Costuma usar uma máscara no rosto?', reaction: 'inquieto', isGuess: false },
    { question: 'Tem alguma cicatriz visível no rosto ou corpo?', reaction: 'reflexivo', isGuess: false },
    { question: 'Usa uniforme escolar?', reaction: 'concentrado', isGuess: false },
    { question: 'O personagem é um demônio ou espírito?', reaction: 'inquieto', isGuess: false },
    { question: 'Pode se transformar ou evoluir fisicamente?', reaction: 'reflexivo', isGuess: false },
  ];

  let fallbacksFicticio = [
    ...(!isCartoon && !isAnime && !isGame ? [
      { question: 'É de um anime?', reaction: 'concentrado', isGuess: false },
      { question: 'É um cartoon ou animação ocidental?', reaction: 'reflexivo', isGuess: false },
      { question: 'É de um videogame?', reaction: 'reflexivo', isGuess: false },
    ] : []),
    { question: 'É o protagonista absoluto da história?', reaction: 'concentrado', isGuess: false },
    { question: 'O personagem usa armas de fogo?', reaction: 'inquieto', isGuess: false },
    { question: 'Usa uma armadura metálica pesada?', reaction: 'reflexivo', isGuess: false },
    { question: 'O personagem é careca?', reaction: 'concentrado', isGuess: false },
    { question: 'É conhecido por ser incrivelmente rico?', reaction: 'inquieto', isGuess: false },
    { question: 'Ele tem um parceiro ou mascote que o acompanha?', reaction: 'reflexivo', isGuess: false },
  ];

  const targetFallbackList = category === 'real'
    ? fallbacksReal
    : (isCartoon && !isAnime && !isGame)
    ? fallbacksCartoon
    : (isAnime || isManga)
    ? fallbacksAnime
    : category === 'ficticio'
    ? fallbacksFicticio
    : [...fallbacksReal, ...fallbacksFicticio];

  const availableFallbacks = targetFallbackList.filter(f => !askedSet.has(normQ(f.question)));

  const pickedFallback = getRandomItem(availableFallbacks);
  
  if (pickedFallback) {
    return pickedFallback;
  }

  return { question: 'Meu instinto já sabe. Vou arriscar!', reaction: 'confiante', isGuess: true, character: '__FORCE_GUESS__' };
}