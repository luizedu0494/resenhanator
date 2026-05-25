/**
 * groq.ts — Resenhanator AI
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

export async function getNextQuestion(
  gameState: GameState,
  invalidQuestions: string[] = [],
): Promise<{
  question: string;
  reaction: string;
  isGuess: boolean;
  character?: string;
  feedback?: string;
}> {
  const questionNumber = gameState.history.length + 1;
  const askedSet = new Set(
    gameState.history
      .filter(h => h.answer !== '__INVALIDA__')
      .map(h => normQ(h.question))
  );

  // Pergunta 1: sempre fixa
  if (questionNumber === 1) {
    return { question: 'É uma pessoa real?', reaction: 'neutro', isGuess: false };
  }

  // Hard limit
  if (questionNumber > 20) {
    return { question: 'Vou arriscar meu melhor chute!', reaction: 'confiante', isGuess: true, character: '__FORCE_GUESS__' };
  }

  const [memory, topQuestions, recentFeedback] = await Promise.all([
    loadAiMemory(),
    getTopQuestions(15),
    getRecentInvalidQuestionFeedback(10),
  ]);

  // ── Lista negra: personagens já jogados nesta sessão do jogador ──────────────
  // Separado em: IA acertou (nunca repita) vs jogador pensou mas IA errou (perfil)
  const alreadyGuessed  = memory.filter(m => m.wasGuessed).map(m => m.character).slice(0, 20);
  const playerFavorites = memory.filter(m => !m.wasGuessed).map(m => m.character).slice(0, 10);

  const neverRepeatCtx = alreadyGuessed.length > 0
    ? `\n🚫 LISTA NEGRA — NÃO CHUTE ESTES (já foram acertados antes): ${alreadyGuessed.join(', ')}.`
    : '';

  const playerProfileCtx = playerFavorites.length > 0
    ? `\n🧠 PERFIL DO JOGADOR (pensa muito nesses): ${playerFavorites.join(', ')}. Use para calibrar, mas NÃO repita nenhum que já foi jogado.`
    : '';

  const category = inferCategory(gameState.history);

  // Helpers de detecção — corrigido: usa h.question, não q indefinido
  const confirmedYes = (kw: string) => gameState.history.some(h =>
    h.question.toLowerCase().includes(kw) &&
    (h.answer === 'Sim' || h.answer === 'Prov. sim')
  );
  const alreadyAskedQ = (kw: string) => gameState.history.some(h =>
    h.question.toLowerCase().includes(kw)
  );

  // Mídias fictícias
  const isAnime     = confirmedYes('anime');
  const isManhwa    = confirmedYes('manhwa') || confirmedYes('webtoon');
  const isManga     = confirmedYes('mangá') || confirmedYes('manga');
  const isCartoon   = confirmedYes('cartoon') || confirmedYes('desenho animado') || confirmedYes('animação ocidental');
  const isGame      = confirmedYes('videogame') || confirmedYes('jogo');
  const isMarvel    = confirmedYes('marvel');
  const isDC        = confirmedYes('dc comics');
  const isImageC    = confirmedYes('image comics');
  const isDarkHorse = confirmedYes('dark horse');
  const isSerie     = confirmedYes('série de tv') || confirmedYes('serie de tv');
  const isFilme     = confirmedYes('filme') && !isAnime && !isCartoon;
  const isLivro     = confirmedYes('livro');

  // Profissões reais
  const isAtleta       = confirmedYes('atleta');
  const isMusico       = confirmedYes('músico') || confirmedYes('cantor') || confirmedYes('cantora');
  const isAtor         = confirmedYes('ator') || confirmedYes('atriz');
  const isApresentador = confirmedYes('apresentador');
  const isPolitico     = confirmedYes('político') || confirmedYes('politico');
  const isInfluencer   = confirmedYes('influencer') || confirmedYes('youtuber');
  const isComediante   = confirmedYes('comediante') || confirmedYes('humorista');
  const isModelo       = confirmedYes('modelo');
  const isEmpresario   = confirmedYes('empresário') || confirmedYes('ceo');

  // Contexto de mídia confirmada para fictício
  let ficticioPath = '';
  if (category === 'ficticio') {
    if (isAnime) {
      ficticioPath =
        '🎌 ANIME confirmado. NÃO pergunte se é série de TV.\n' +
        'Caminho: qual anime? (Dragon Ball/Naruto/One Piece/Demon Slayer?) → protagonista? → poderes? → CHUTE.';
    } else if (isManhwa) {
      ficticioPath =
        '🇰🇷 MANHWA/WEBTOON confirmado (ex: Solo Leveling, Tower of God).\n' +
        'Caminho: qual manhwa? → protagonista? → poderes? → CHUTE.';
    } else if (isManga) {
      ficticioPath = '📚 MANGÁ confirmado. Caminho: qual mangá? → protagonista? → poderes? → CHUTE.';
    } else if (isCartoon) {
      ficticioPath =
        '📺 CARTOON OCIDENTAL confirmado (Scooby-Doo, Simpsons, Bob Esponja, Hanna-Barbera, Cartoon Network, Nickelodeon).\n' +
        '⚠️ NÃO pergunte se é série live-action. NÃO pergunte se é anime.\n' +
        'Caminho: é animal? → é da Disney/Nickelodeon/Cartoon Network/Hanna-Barbera? → protagonista? → CHUTE.';
    } else if (isGame) {
      ficticioPath =
        '🎮 VIDEOGAME confirmado. NÃO pergunte se é série ou anime.\n' +
        'Caminho: Nintendo/PlayStation/Xbox? → qual franquia? → protagonista? → CHUTE.';
    } else if (isMarvel) {
      ficticioPath = '🦸 MARVEL confirmado. Caminho: herói ou vilão? → MCU? → qual franquia? → CHUTE.';
    } else if (isDC) {
      ficticioPath = '🦇 DC COMICS confirmado. Caminho: herói ou vilão? → Gotham? → CHUTE.';
    } else if (isImageC) {
      ficticioPath = '📖 IMAGE COMICS confirmado (Spawn, Invincible). Caminho: qual série? → CHUTE.';
    } else if (isDarkHorse) {
      ficticioPath = '📖 DARK HORSE confirmado (Hellboy, Sin City). Caminho: qual série? → CHUTE.';
    } else if (isSerie) {
      ficticioPath =
        '📺 SÉRIE TV LIVE-ACTION confirmada. NÃO inclui anime nem cartoon.\n' +
        'Caminho: drama ou comédia? → americana ou brasileira? → qual série? → CHUTE.';
    } else if (isFilme) {
      ficticioPath = '🎬 FILME confirmado. Caminho: qual gênero? → qual franquia? → CHUTE.';
    } else if (isLivro) {
      ficticioPath = '📚 LIVRO confirmado. Caminho: fantasia/ficção científica? → qual obra? → CHUTE.';
    } else {
      // Mídia ainda desconhecida — guia a descoberta em ordem
      const todasMidias = [
        { asked: 'anime',          q: 'É de um anime?' },
        { asked: 'cartoon',        q: 'É de um cartoon ou desenho animado ocidental?' },
        { asked: 'marvel',         q: 'É da Marvel?' },
        { asked: 'dc comics',      q: 'É da DC Comics?' },
        { asked: 'videogame',      q: 'É de um videogame?' },
        { asked: 'série de tv',    q: 'É de uma série de TV live-action?' },
        { asked: 'filme',          q: 'É de um filme?' },
        { asked: 'mangá',          q: 'É de um mangá (não anime)?' },
        { asked: 'manhwa',         q: 'É de um manhwa ou webtoon?' },
        { asked: 'livro',          q: 'É originalmente de um livro?' },
        { asked: 'image comics',   q: 'É da Image Comics?' },
        { asked: 'dark horse',     q: 'É da Dark Horse Comics?' },
      ].find(u => !alreadyAskedQ(u.asked));

      ficticioPath = todasMidias
        ? `🗺️ Mídia desconhecida. Próxima sugerida: "${todasMidias.q}"\n` +
          'MÍDIAS SÃO DIFERENTES:\n' +
          '  • Anime = animação japonesa (Dragon Ball, Naruto)\n' +
          '  • Cartoon = animação ocidental (Scooby-Doo, Simpsons, Bob Esponja)\n' +
          '  • Manhwa = quadrinho coreano (Solo Leveling)\n' +
          '  • Série TV = live-action (Breaking Bad, GOT)\n' +
          '  • Game = videogame interativo (Mario, Zelda)\n' +
          'Se confirmou ANIME, NUNCA pergunte se é série. Se confirmou CARTOON, NUNCA pergunte se é anime.'
        : '🗺️ Mídias exploradas. Aprofunde: protagonista, poderes, item marcante → CHUTE.';
    }
  }

  const categoryCtx = category === 'real'
    ? '✅ PESSOA REAL.\nCaminho: gênero → nacionalidade → vivo? → área → subárea → CHUTE.\n' +
      'ÁREAS (pergunte uma por vez):\n' +
      '  Esporte: atleta, futebolista, tenista, lutador\n' +
      '  Música: cantor(a), rapper, funkeiro, sertanejo, DJ\n' +
      '  TV/Entretenimento: ator/atriz, apresentador, comediante, influencer/youtuber\n' +
      '  Moda/Negócios: modelo, empresário, CEO\n' +
      '  Arte/Cultura: escritor, cineasta\n' +
      '  Política: político, presidente, governador\n' +
      '  Gastronomia: chef famoso'
    : category === 'ficticio'
    ? `✅ FICTÍCIO.\n${ficticioPath}`
    : '⚠️ Ainda não sabe se é real ou fictício.';
  const invalidCtx = invalidQuestions.length > 0
    ? `\n🚨 PERGUNTAS RECUSADAS PELO JOGADOR (não são sim/não):\n` +
      invalidQuestions.map(q => `- "${q}"`).join('\n') +
      '\nNUNCA faça perguntas nesse estilo.'
    : '';

  // Feedback histórico do Firestore
  const feedbackCtx = recentFeedback.length > 0
    ? `\n📊 PERGUNTAS QUE JOGADORES JÁ RECUSARAM (evite):\n` +
      recentFeedback.slice(0, 5).map((f: any) => `- "${f.question}"`).join('\n')
    : '';

  // Perguntas mais eficazes
  const effectiveCtx = topQuestions.length > 0
    ? `\nPERGUNTAS EFICAZES (prefira quando não feitas):\n` +
      topQuestions
        .filter(q => !askedSet.has(normQ(q.question)))
        .slice(0, 5)
        .map(q => `- "${q.question}" (${q.successRate}% acerto)`)
        .join('\n')
    : '';

  const askedCtx = gameState.history.length > 0
    ? `\n🚫 PROIBIDAS (já feitas):\n` +
      gameState.history
        .filter(h => h.answer !== '__INVALIDA__')
        .map(h => `"${h.question}"`)
        .join(', ')
    : '';

  const urgency =
    questionNumber > 15 ? '🚨 CHUTE OBRIGATÓRIO agora!' :
    questionNumber > 12 ? '⚠️ Máximo 1 pergunta ainda.' :
    questionNumber > 8  ? 'Prepare o chute.' :
                          'Mapeie e aprofunde.';

  const historyText = gameState.history
    .filter(h => h.answer !== '__INVALIDA__')
    .map((h, i) => `${i + 1}. "${h.question}" → ${h.answer}`)
    .join('\n');

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.6,
        max_tokens: 200,
        messages: [
          {
            role: 'system',
            content:
`Você é o Resenhanator, um gênio arrogante que adivinha personagens. Pergunta ${questionNumber}.

${categoryCtx}${neverRepeatCtx}${playerProfileCtx}${invalidCtx}${feedbackCtx}${effectiveCtx}${askedCtx}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRA ABSOLUTA: TODA PERGUNTA = SIM OU NÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ "É do sexo masculino?" "É brasileiro?" "É da Marvel?" "É de um anime?" "É apresentador?"
❌ "É da Marvel ou DC?" "É músico ou ator?" "É de qual país?" "Como se chama?"
NUNCA junte duas opções com "ou". Pergunte uma coisa por vez.

${urgency}
Se as respostas já identificam um único personagem, CHUTE IMEDIATAMENTE.
${alreadyGuessed.length > 0 ? `NÃO CHUTE: ${alreadyGuessed.join(', ')}.` : ''}

FORMATO: JSON puro, sem markdown:
Pergunta: {"question":"...","reaction":"neutro|concentrado|confiante|desesperado|esnobe|inquieto|irritado|reflexivo","isGuess":false}
Chute:    {"question":"É [nome]?","reaction":"confiante","isGuess":true,"character":"[nome]"}`,
          },
          {
            role: 'user',
            content: historyText
              ? `Histórico:\n${historyText}\n\nFaça a pergunta ${questionNumber}.`
              : 'Comece.',
          },
        ],
      }),
    });

    const data   = await response.json();
    const raw    = data.choices?.[0]?.message?.content || '';
    const clean  = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    if (!askedSet.has(normQ(parsed.question ?? '')) && isValidYesNoQuestion(parsed.question ?? '')) {
      return parsed;
    }

    // Pergunta duplicada ou inválida — força chute se já passou da 10
    if (questionNumber > 10) {
      return { question: 'Já sei quem é. Vou arriscar!', reaction: 'confiante', isGuess: true, character: '__FORCE_GUESS__' };
    }
  } catch { /* JSON inválido — cai nos fallbacks */ }

  // Embaralha um array sem modificar o original
  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Fallbacks por categoria
  // Âncoras: perguntas essenciais que vêm primeiro (gênero, nacionalidade, vivo)
  // Opcionais: embaralhadas para variar a sequência a cada partida
  const realAncoras = [
    { question: 'É do sexo masculino?',            reaction: 'concentrado', isGuess: false },
    { question: 'É brasileiro?',                   reaction: 'reflexivo',   isGuess: false },
    { question: 'Ainda está vivo?',                reaction: 'inquieto',    isGuess: false },
  ];
  const realOpcionais = shuffle([
    { question: 'É atleta?',                       reaction: 'concentrado', isGuess: false },
    { question: 'É músico?',                       reaction: 'reflexivo',   isGuess: false },
    { question: 'É ator?',                         reaction: 'inquieto',    isGuess: false },
    { question: 'É apresentador de TV?',           reaction: 'concentrado', isGuess: false },
    { question: 'É influencer ou youtuber?',       reaction: 'reflexivo',   isGuess: false },
    { question: 'É comediante?',                   reaction: 'inquieto',    isGuess: false },
    { question: 'É modelo?',                       reaction: 'concentrado', isGuess: false },
    { question: 'É empresário?',                   reaction: 'reflexivo',   isGuess: false },
    { question: 'É escritor?',                     reaction: 'inquieto',    isGuess: false },
    { question: 'É chef de cozinha famoso?',       reaction: 'concentrado', isGuess: false },
    { question: 'É político?',                     reaction: 'reflexivo',   isGuess: false },
    { question: 'Ficou famoso após os anos 2000?', reaction: 'inquieto',    isGuess: false },
    { question: 'Tem mais de 50 anos?',            reaction: 'concentrado', isGuess: false },
  ]);
  const fallbacksReal = [...realAncoras, ...realOpcionais];

  const ficticioAncoras = [
    { question: 'É de um anime?',                      reaction: 'concentrado', isGuess: false },
    { question: 'É de um cartoon ou desenho animado?', reaction: 'reflexivo',   isGuess: false },
    { question: 'É da Marvel?',                        reaction: 'inquieto',    isGuess: false },
    { question: 'É da DC Comics?',                     reaction: 'concentrado', isGuess: false },
    { question: 'É de um videogame?',                  reaction: 'reflexivo',   isGuess: false },
  ];
  const ficticioOpcionais = shuffle([
    { question: 'É de uma série de TV live-action?', reaction: 'inquieto',    isGuess: false },
    { question: 'É de um filme?',                    reaction: 'concentrado', isGuess: false },
    { question: 'É de um mangá?',                    reaction: 'reflexivo',   isGuess: false },
    { question: 'É de um manhwa ou webtoon?',        reaction: 'inquieto',    isGuess: false },
    { question: 'É originalmente de um livro?',      reaction: 'concentrado', isGuess: false },
    { question: 'É da Image Comics?',                reaction: 'reflexivo',   isGuess: false },
    { question: 'É da Dark Horse Comics?',           reaction: 'inquieto',    isGuess: false },
    { question: 'É o protagonista da história?',     reaction: 'concentrado', isGuess: false },
    { question: 'Tem superpoderes?',                 reaction: 'reflexivo',   isGuess: false },
    { question: 'É um vilão?',                       reaction: 'inquieto',    isGuess: false },
    { question: 'É humano?',                         reaction: 'concentrado', isGuess: false },
  ]);
  const fallbacksFicticio = [...ficticioAncoras, ...ficticioOpcionais];

  const fallbacks = category === 'real'
    ? fallbacksReal
    : category === 'ficticio'
    ? fallbacksFicticio
    : [...ficticioAncoras, ...realAncoras, ...shuffle([...ficticioOpcionais, ...realOpcionais])];

  const available = fallbacks.find(f => !askedSet.has(normQ(f.question)));
  if (available) return available;

  return { question: 'Já tenho tudo. Hora de arriscar!', reaction: 'confiante', isGuess: true, character: '__FORCE_GUESS__' };
}