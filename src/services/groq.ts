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

  // Pergunta 1 — sempre fixa
  if (questionNumber === 1) {
    return { question: 'É uma pessoa real?', reaction: 'neutro', isGuess: false };
  }

  // Hard limit
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

  const neverRepeat = memory.map(m => m.character);
  const playerLikes = memory.filter(m => !m.wasGuessed).map(m => m.character);
  const aiGuessed   = memory.filter(m => m.wasGuessed).map(m => m.character);
  const category    = inferCategory(gameState.history);

  const confirmedYes = (kw: string) => gameState.history.some(h =>
    h.question.toLowerCase().includes(kw) && (h.answer === 'Sim' || h.answer === 'Prov. sim'));
  const alreadyAsked = (kw: string) => gameState.history.some(h =>
    h.question.toLowerCase().includes(kw));

  // Detecta mídia/universo confirmado
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

  // Monta contexto do caminho fictício com base na mídia confirmada
  let ficticioPath = '';
  if (category === 'ficticio') {
    if (isAnime || isManga) {
      ficticioPath = `
🎌 CONFIRMADO: Anime/Mangá.
Caminho: qual série? (Dragon Ball? Naruto? One Piece? AoT? Demon Slayer? MHA? HxH? Bleach? FMA? Cowboy Bebop?) → protagonista? → poderes? → CHUTE.
⚠️ Anime NÃO é série de TV. NUNCA pergunte "É de série?" para anime.`;
    } else if (isManhua) {
      ficticioPath = `
📱 CONFIRMADO: Manhwa/Manhua/Webtoon (coreano ou chinês).
Caminho: qual obra? (Solo Leveling? Tower of God? Noblesse? Omniscient Reader?) → protagonista? → CHUTE.`;
    } else if (isCartoon) {
      ficticioPath = `
📺 CONFIRMADO: Cartoon/Animação Ocidental (NÃO anime).
Inclui: Hanna-Barbera (Scooby-Doo, Flintstones, Jetsons), Looney Tunes, Disney clássico, Pixar, DreamWorks, Nickelodeon (Bob Esponja, Rugrats), Cartoon Network (Ben 10, Samurai Jack, As Meninas Superpoderosas), Fox (Simpsons, Futurama, Family Guy), Adult Swim (Rick and Morty, Bojack), Netflix (Big Mouth).
Caminho: estúdio/emissora? → protagonista da série? → características físicas marcantes? → CHUTE.
⚠️ Cartoon NÃO é anime. São mídias completamente diferentes.`;
    } else if (isGame) {
      ficticioPath = `
🎮 CONFIRMADO: Videogame.
Caminho: plataforma? (Nintendo/PlayStation/Xbox/PC/Mobile) → qual franquia? → protagonista? → CHUTE.
⚠️ Videogame NÃO é série de TV.`;
    } else if (isDisney) {
      ficticioPath = `
🏰 CONFIRMADO: Disney/Pixar.
Inclui: princesas, vilões, animais falantes, personagens de filmes animados.
Caminho: qual filme? → protagonista? → características? → CHUTE.`;
    } else if (isMarvel) {
      ficticioPath = `
🦸 CONFIRMADO: Marvel.
Caminho: herói ou vilão? → tem superpoderes? → Vingadores/X-Men/Guardiões? → CHUTE.`;
    } else if (isDC) {
      ficticioPath = `
🦇 CONFIRMADO: DC Comics.
Caminho: herói ou vilão? → Gotham/Metrópolis? → qual série/filme? → CHUTE.`;
    } else if (isHQ) {
      ficticioPath = `
📚 CONFIRMADO: HQ/Quadrinho (não Marvel nem DC).
Inclui: Image Comics (Spawn), Dark Horse (Hellboy), Bonelli (Tex, Zagor, Dylan Dog), Vertigo, Turma da Mônica.
Caminho: qual editora? → brasileiro ou estrangeiro? → protagonista? → CHUTE.`;
    } else if (isSerie) {
      ficticioPath = `
📺 CONFIRMADO: Série de TV (live-action).
Inclui: drama, comédia, thriller, sci-fi — brasileira ou internacional.
Caminho: drama ou comédia? → americana/brasileira/coreana/britânica? → qual série? → protagonista? → CHUTE.
⚠️ NÃO inclui anime nem cartoon.`;
    } else if (isFilme) {
      ficticioPath = `
🎬 CONFIRMADO: Filme (não animado).
Caminho: gênero? → americano ou outro? → qual franquia? → protagonista? → CHUTE.`;
    } else if (isLivro) {
      ficticioPath = `
📖 CONFIRMADO: Livro/Literatura.
Inclui: romances, fantasia (Harry Potter, Senhor dos Anéis, Game of Thrones livro), ficção científica, literatura brasileira, clássicos, mangá literário.
Caminho: gênero literário? → brasileiro ou estrangeiro? → qual obra? → protagonista? → CHUTE.`;
    } else if (isTeatro) {
      ficticioPath = `
🎭 CONFIRMADO: Teatro/Musical.
Inclui: personagens de Shakespeare, musicais da Broadway (Hamilton, Wicked, Phantom), ópera.
Caminho: clássico ou moderno? → qual obra? → protagonista? → CHUTE.`;
    } else if (isMito) {
      ficticioPath = `
⚡ CONFIRMADO: Mitologia/Folclore/Lenda.
Inclui: mitologia grega/romana/nórdica/egípcia/japonesa, folclore brasileiro (Saci, Curupira), lendas medievais (Rei Artur).
Caminho: qual mitologia? → deus ou herói? → qual? → CHUTE.`;
    } else {
      // Universo ainda desconhecido — descobre um por vez
      const universosNaoPerguntos = [
        { kw: 'anime',               q: 'É de um anime?' },
        { kw: 'cartoon',             q: 'É um cartoon ou animação ocidental (não anime)?' },
        { kw: 'videogame',           q: 'É de um videogame?' },
        { kw: 'marvel',              q: 'É da Marvel?' },
        { kw: 'dc comics',           q: 'É da DC Comics?' },
        { kw: 'disney',              q: 'É da Disney ou Pixar?' },
        { kw: 'série de tv',         q: 'É de uma série de TV (live-action)?' },
        { kw: 'filme',               q: 'É de um filme (não animado)?' },
        { kw: 'livro',               q: 'É originalmente de um livro ou romance?' },
        { kw: 'quadrinho',           q: 'É de um quadrinho ou HQ?' },
        { kw: 'manhwa',              q: 'É de um manhwa, manhua ou webtoon?' },
        { kw: 'mitologia',           q: 'É um personagem de mitologia ou folclore?' },
        { kw: 'teatro',              q: 'É de uma peça de teatro ou musical?' },
      ].find(u => !alreadyAsked(u.kw));

      ficticioPath = universosNaoPerguntos
        ? `\n🗺️ Universo ainda desconhecido. Próxima sugerida: "${universosNaoPerguntos.q}"\n\nMÍDIAS SÃO EXCLUSIVAS:\n• Anime = japonês animado\n• Cartoon = animação ocidental\n• Série TV = live-action\n• Videogame = jogo interativo`
        : '\n🗺️ Universo já explorado. Aprofunde traços e CHUTE.';
    }
  }

  // Contexto de categoria
  const categoryCtx = category === 'real'
    ? `\n✅ PESSOA REAL.
CAMINHO OBRIGATÓRIO:
→ Gênero (masculino/feminino?)
→ Nacionalidade (brasileiro? americano? europeu? asiático?)
→ Ainda vivo?
→ Quando ficou famoso? (antes/depois de 2000?)
→ Área principal — escolha UMA e aprofunde:

🏆 ESPORTES: futebol / basquete / MMA/UFC / tênis / vôlei / natação / F1 / boxe / atletismo
🎵 MÚSICA: funk / sertanejo / pagode / axé / MPB / rock / pop / rap/trap / eletrônico / k-pop / jazz / clássico / gospel
🎭 ENTRETENIMENTO: ator de novela / ator de cinema / apresentador de TV / comediante / influencer / youtuber / streamer / tiktoker
🏛️ POLÍTICA: presidente / governador / senador / prefeito / ministro / ativista
💡 CIÊNCIA/ARTE: cientista / inventor / escritor / artista plástico / filósofo / médico famoso / chef de cozinha / astronauta
💼 NEGÓCIOS: empresário / CEO / bilionário
👑 REALEZA/HISTÓRIA: rei / rainha / figura histórica

Após identificar a área, aprofunde com subperguntas específicas e CHUTE.`
    : category === 'ficticio'
    ? `\n✅ FICTÍCIO.${ficticioPath}`
    : '\n⚠️ Ainda não confirmou real ou fictício.';

  const askedCtx = gameState.history.length > 0
    ? `\n\n🚫 JÁ PERGUNTADO — NUNCA REPITA:\n${gameState.history.map((h, i) => `${i + 1}. "${h.question}" → ${h.answer}`).join('\n')}`
    : '';

  const neverRepeatCtx   = neverRepeat.length > 0 ? `\nNUNCA CHUTE: ${neverRepeat.join(', ')}.` : '';
  const playerProfileCtx = playerLikes.length  > 0 ? `\nPERFIL DO JOGADOR: ${playerLikes.join(', ')}.` : '';
  const aiStrengthCtx    = aiGuessed.length    > 0 ? `\nIA já acertou: ${aiGuessed.slice(0, 10).join(', ')}.` : '';

  const feedbackCtx = recentFeedback.length > 0
    ? `\n\n⚠️ ERROS RECENTES (perguntas que o jogador marcou como inválidas):\n`
      + recentFeedback.map(f => `- "${f.question}"`).join('\n')
    : '';

  const effectiveQCtx = topQuestions.length > 0
    ? `\n\nPERGUNTAS MAIS EFICAZES (use se ainda não fez):\n`
      + topQuestions.filter(q => !askedSet.has(normQ(q.question))).slice(0, 5)
          .map(q => `- "${q.question}" (${q.successRate}% acerto)`).join('\n')
    : '';

  const urgency =
    questionNumber > 18 ? '🚨 CHUTE OBRIGATÓRIO agora!' :
    questionNumber > 15 ? '⚠️ Hora de chutar. Máx 1 pergunta ainda.' :
    questionNumber > 10 ? 'Prepare o chute — aprofunde só o essencial.' :
                          'Mapeie e aprofunde seguindo o caminho da categoria.';

  const historyText = gameState.history
    .map((h, i) => `${i + 1}. P: "${h.question}" → R: ${h.answer}`)
    .join('\n');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.EXPO_PUBLIC_GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 250,
      messages: [
        {
          role: 'system',
          content:
`Você é o Resenhanator, um gênio arrogante e divertido que tenta adivinhar personagens. Pergunta ${questionNumber}/20.
${categoryCtx}${neverRepeatCtx}${playerProfileCtx}${aiStrengthCtx}${askedCtx}${effectiveQCtx}${feedbackCtx}

━━━ REGRA DE OURO ━━━
Toda pergunta DEVE ser respondível com SIM ou NÃO.
✓ "É brasileiro?" / "É da Marvel?" / "Tem superpoderes?"
✗ "É de qual país?" / "É de filme ou série?" / "Qual área?"

━━━ DEDUÇÃO IMEDIATA ━━━
Se as respostas já identificam UM ÚNICO personagem: CHUTE IMEDIATAMENTE.
Ex: fictício + anime + Dragon Ball + protagonista = Goku → CHUTE JÁ
Ex: fictício + cartoon ocidental + Hanna-Barbera + cachorro + dono medroso = Scooby-Doo → CHUTE JÁ
Ex: real + Brasil + futebol + aposentado + maior de todos os tempos = Pelé → CHUTE JÁ

━━━ LIMITE ━━━
${urgency}
Máximo 2 perguntas por subárea, depois chuta.

━━━ SAÍDA ━━━
APENAS JSON válido, sem markdown:
Pergunta: {"question":"...","reaction":"neutro|concentrado|confiante|desesperado|despeitado|esnobe|inquieto|irritado|reflexivo","isGuess":false}
Chute:    {"question":"É [nome]?","reaction":"confiante","isGuess":true,"character":"[nome]"}`,
        },
        {
          role: 'user',
          content: `Histórico (${questionNumber - 1} perguntas):\n${historyText}\n\nFaça a pergunta ${questionNumber}. NÃO repita nenhuma do histórico. Pergunta deve ser Sim/Não.`,
        },
      ],
    }),
  });

  const data = await response.json();
  const raw  = data.choices?.[0]?.message?.content || '';

  let parsed: any = null;
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {}

  if (parsed) {
    const isDuplicate  = askedSet.has(normQ(parsed.question ?? ''));
    const isValidQ     = isValidYesNoQuestion(parsed.question ?? '');

    if (!isDuplicate && isValidQ) return parsed;

    if (!isValidQ) {
      return { question: parsed.question, reaction: 'irritado', isGuess: false, feedback: 'invalid_question' };
    }
    if (questionNumber > 10) {
      return { question: 'Meu instinto já sabe. Vou arriscar!', reaction: 'confiante', isGuess: true, character: '__FORCE_GUESS__' };
    }
  }

  // Fallbacks por categoria
  const fallbacksReal = [
    { question: 'É do sexo masculino?',            reaction: 'concentrado', isGuess: false },
    { question: 'É brasileiro?',                   reaction: 'reflexivo',   isGuess: false },
    { question: 'Ainda está vivo?',                reaction: 'inquieto',    isGuess: false },
    { question: 'É atleta profissional?',          reaction: 'concentrado', isGuess: false },
    { question: 'É músico ou cantor?',             reaction: 'reflexivo',   isGuess: false },
    { question: 'É ator ou atriz?',                reaction: 'inquieto',    isGuess: false },
    { question: 'É apresentador de TV?',           reaction: 'concentrado', isGuess: false },
    { question: 'É político?',                     reaction: 'reflexivo',   isGuess: false },
    { question: 'Ficou famoso após os anos 2000?', reaction: 'inquieto',    isGuess: false },
    { question: 'Tem mais de 10 milhões de seguidores nas redes sociais?', reaction: 'concentrado', isGuess: false },
  ];

  const fallbacksFicticio = [
    { question: 'É de um anime?',                  reaction: 'concentrado', isGuess: false },
    { question: 'É um cartoon ou animação ocidental?', reaction: 'reflexivo', isGuess: false },
    { question: 'É da Marvel?',                   reaction: 'inquieto',    isGuess: false },
    { question: 'É da DC Comics?',                reaction: 'concentrado', isGuess: false },
    { question: 'É de um videogame?',             reaction: 'reflexivo',   isGuess: false },
    { question: 'É da Disney ou Pixar?',          reaction: 'inquieto',    isGuess: false },
    { question: 'É o protagonista da história?',  reaction: 'concentrado', isGuess: false },
    { question: 'Tem superpoderes ou habilidades especiais?', reaction: 'reflexivo', isGuess: false },
    { question: 'É um vilão?',                    reaction: 'inquieto',    isGuess: false },
    { question: 'É de um livro ou romance?',      reaction: 'concentrado', isGuess: false },
  ];

  const fallbacks = category === 'real'
    ? fallbacksReal
    : category === 'ficticio'
    ? fallbacksFicticio
    : [...fallbacksReal, ...fallbacksFicticio];

  const available = fallbacks.find(f => !askedSet.has(normQ(f.question)));
  if (available) return available;

  return { question: 'Já tenho tudo. Hora de arriscar!', reaction: 'confiante', isGuess: true, character: '__FORCE_GUESS__' };
}