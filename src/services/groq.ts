/**
 * groq.ts — Resenhanator AI (MELHORADO)
 *
 * Fluxo de perguntas obrigatório:
 *   Pergunta 1 → SEMPRE "É uma pessoa real?" (âncora de tudo)
 *   SE REAL:    gênero → nacionalidade → vivo/morto → área → subárea → chute
 *   SE FICTÍCIO: universo → tipo → poderes → protagonista → chute
 *
 * MELHORIAS:
 * - Validação rigorosa: perguntas DEVEM ser respondíveis com Sim/Não
 * - Base de editoras: Marvel, DC, Vertigo, Image Comics, Dark Horse, Bonelli, etc.
 * - Raciocínio estruturado: contexto melhorado para decisões lógicas
 * - Feedback da IA: sistema detecta perguntas compostas e orienta
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
    if (q.includes('pessoa real') && (a === 'Não' || a === 'Prov. não')) return 'ficticio';
  }
  return null;
}

// Detecta se a pergunta obrigatória de abertura já foi feita
function alreadyAskedRealPerson(history: { question: string; answer: string }[]): boolean {
  return history.some(h => h.question.toLowerCase().includes('pessoa real'));
}

/**
 * VALIDAÇÃO RIGOROSA: Detecta se uma pergunta é respondível com Sim/Não
 * Retorna true se a pergunta é válida (Sim/Não), false se é composta ou aberta
 */
export function isValidYesNoQuestion(question: string): boolean {
  const q = question.toLowerCase().trim();
  
  // Padrões que indicam perguntas INVÁLIDAS (compostas ou abertas)
  const invalidPatterns = [
    /qual\s+(é|são|era|eram)/i,           // "Qual é...", "Qual era..."
    /quem\s+(é|são|era|eram)/i,           // "Quem é...", "Quem era..."
    /onde\s+(é|fica|mora|nasceu)/i,       // "Onde é...", "Onde mora..."
    /quando\s+(nasceu|morreu|foi)/i,      // "Quando nasceu...", "Quando foi..."
    /quanto\s+(tempo|anos|idade)/i,       // "Quanto tempo...", "Quantos anos..."
    /como\s+(é|se chama|funciona)/i,      // "Como é...", "Como se chama..."
    /por\s+quê|porque/i,                  // "Por quê?", "Porque..."
    /de\s+qual\s+(país|série|filme|universo)/i, // "De qual país...", "De qual série..."
    /qual\s+é\s+a\s+(profissão|área|série|filme)/i, // "Qual é a profissão..."
    /em\s+qual\s+(ano|década|série|filme)/i, // "Em qual ano...", "Em qual série..."
    /\s+ou\s+/i,                          // "É X ou Y?" (pergunta composta)
    /\s+e\s+/i,                           // "É X e Y?" (pergunta composta)
  ];
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(q)) return false;
  }
  
  // Padrões que indicam perguntas VÁLIDAS (Sim/Não)
  const validPatterns = [
    /^é\s+/i,                             // "É...", "É do...", "É uma..."
    /^está\s+/i,                          // "Está...", "Está vivo..."
    /^tem\s+/i,                           // "Tem...", "Tem superpoderes..."
    /^foi\s+/i,                           // "Foi...", "Foi criado..."
    /^(apareceu|aparece)\s+/i,            // "Apareceu em...", "Aparece em..."
    /^(nasceu|morreu|viveu)\s+/i,         // "Nasceu em...", "Morreu em..."
    /^(pertence|faz parte)\s+/i,          // "Pertence a...", "Faz parte de..."
    /^(é\s+)?(do|da|de|um|uma)\s+/i,      // "É do...", "É uma...", "É de..."
    /^(já\s+)?(é|era|foi)\s+/i,           // "Já é...", "Era...", "Foi..."
  ];
  
  let isValid = false;
  for (const pattern of validPatterns) {
    if (pattern.test(q)) {
      isValid = true;
      break;
    }
  }
  
  return isValid;
}

/**
 * BASE DE CONHECIMENTO: Editoras e universos de quadrinhos
 * Usada para enriquecer o contexto da IA
 */
const comicUniverses = {
  marvel: {
    name: 'Marvel',
    characters: ['Homem-Aranha', 'Homem de Ferro', 'Capitão América', 'Thor', 'Hulk', 'Viúva Negra', 'Gavião Arqueiro', 'Pantera Negra', 'Doutor Estranho', 'Feiticeira Escarlate', 'Visão', 'Homem-Formiga', 'Vespa', 'Capitã Marvel', 'Eternos', 'Shang-Chi'],
    description: 'Universo cinematográfico e de quadrinhos Marvel com heróis e vilões icônicos'
  },
  dc: {
    name: 'DC',
    characters: ['Superman', 'Batman', 'Mulher-Maravilha', 'Flash', 'Lanterna Verde', 'Aquaman', 'Cyborg', 'Falcão Negro', 'Joker', 'Lex Luthor', 'Duas-Caras', 'Pinguim'],
    description: 'Universo DC com super-heróis e vilões clássicos'
  },
  vertigo: {
    name: 'Vertigo',
    characters: ['Hellblazer', 'Sandman', 'Swamp Thing', 'Preacher'],
    description: 'Selo Vertigo da DC com histórias mais maduras e sombrias'
  },
  imageComics: {
    name: 'Image Comics',
    characters: ['Spawn', 'Savage Dragon', 'Witchblade', 'The Maxx'],
    description: 'Editora independente com personagens únicos e inovadores'
  },
  darkHorse: {
    name: 'Dark Horse',
    characters: ['Hellboy', 'Aliens', 'Predator', 'Sin City'],
    description: 'Editora conhecida por histórias de horror e ficção científica'
  },
  bonelli: {
    name: 'Bonelli',
    characters: ['Zagor', 'Tex', 'Diabolik', 'Dylan Dog', 'Martin Mystère'],
    description: 'Editora italiana com personagens clássicos de aventura'
  },
  anime: {
    name: 'Anime/Mangá',
    characters: ['Goku', 'Naruto', 'Luffy', 'Ichigo', 'Tanjiro', 'Deku', 'Sasuke', 'Sakura', 'Saitama', 'Todoroki', 'Bakugo', 'Anya Forger'],
    description: 'Universo de anime e mangá com personagens populares'
  },
  nintendoGames: {
    name: 'Nintendo',
    characters: ['Mario', 'Luigi', 'Donkey Kong', 'Link', 'Zelda', 'Pikachu', 'Bowser', 'Peach', 'Yoshi', 'Kirby', 'Fox McCloud', 'Samus Aran'],
    description: 'Personagens clássicos de videogames Nintendo'
  },
  playstationGames: {
    name: 'PlayStation',
    characters: ['Kratos', 'Nathan Drake', 'Lara Croft', 'Aloy', 'Sackboy', 'Ratchet', 'Clank', 'Jak', 'Daxter', 'Cloud Strife', 'Squall Leonhart'],
    description: 'Personagens icônicos de jogos PlayStation'
  },
  xboxGames: {
    name: 'Xbox',
    characters: ['Master Chief', 'Cortana', 'Marcus Fenix', 'Banjo', 'Kazooie'],
    description: 'Personagens de franquias Xbox'
  },
  pcGames: {
    name: 'PC Games',
    characters: ['Gordon Freeman', 'Alyx Vance', 'Geralt de Rivia', 'Ciri', 'The Narrator', 'Chell', 'GLaDOS'],
    description: 'Personagens memoráveis de jogos para PC'
  },
  sitcoms: {
    name: 'Sitcoms/Séries Clássicas',
    characters: ['Homer Simpson', 'Bart Simpson', 'Marge Simpson', 'Chandler Bing', 'Monica Geller', 'Ross Geller', 'Rachel Green', 'Phoebe Buffay', 'Joey Tribbiani', 'Sheldon Cooper', 'Leonard Hofstadter', 'Penny'],
    description: 'Personagens de séries de TV e sitcoms clássicas'
  },
  dramasSeries: {
    name: 'Dramas/Séries Contemporâneas',
    characters: ['Jon Snow', 'Daenerys Targaryen', 'Walter White', 'Jesse Pinkman', 'Eleven', 'Dustin Henderson', 'Mike Wheeler', 'Nancy Wheeler', 'Tyrion Lannister', 'Cersei Lannister'],
    description: 'Personagens de séries de drama contemporâneas'
  },
};

export async function getNextQuestion(gameState: GameState): Promise<{
  question: string;
  reaction: string;
  isGuess: boolean;
  character?: string;
  feedback?: string;
}> {
  const questionNumber = gameState.history.length + 1;
  const askedSet = new Set(gameState.history.map(h => normQ(h.question)));

  // ── Pergunta 1: sempre "É uma pessoa real?" ────────────────────────────────
  if (questionNumber === 1) {
    return {
      question: 'É uma pessoa real?',
      reaction: 'neutro',
      isGuess: false,
    };
  }

  // ── Hard limit no cliente ──────────────────────────────────────────────────
  if (questionNumber > 18) {
    return {
      question: 'Já tenho pistas suficientes. Vou arriscar meu melhor chute!',
      reaction: 'confiante',
      isGuess: true,
      character: '__FORCE_GUESS__',
    };
  }

  // ── Dados paralelos ────────────────────────────────────────────────────────
  const [memory, topQuestions, recentFeedback] = await Promise.all([
    loadAiMemory(),
    getTopQuestions(15),
    getRecentInvalidQuestionFeedback(10),
  ]);

  const feedbackCtx = recentFeedback.length > 0
    ? `\n\n⚠️ ERROS RECENTES (Você errou e o usuário te corrigiu nestas perguntas):\n`
      + recentFeedback.map(f => `- Pergunta: "${f.question}" | Motivo: Pergunta composta ou aberta.`).join('\n')
    : '';

  if (recentFeedback.length > 0) {
    console.log(`[groq] Carregados ${recentFeedback.length} feedbacks para aprendizado.`);
  }

  const neverRepeat = memory.map(m => m.character);
  const playerLikes = memory.filter(m => !m.wasGuessed).map(m => m.character);
  const aiGuessed   = memory.filter(m => m.wasGuessed).map(m => m.character);

  // Categoria já confirmada pelo jogador
  const category = inferCategory(gameState.history);
  const categoryCtx = category === 'real'
    ? '\n✅ CONFIRMADO: É uma PESSOA REAL. Siga o caminho: gênero → nacionalidade → se ainda vivo → área (músico/ator/atleta/político) → subárea → traços marcantes → CHUTE.'
    : category === 'ficticio'
    ? '\n✅ CONFIRMADO: É FICTÍCIO. Siga o caminho: universo (Marvel/DC/anime/game/série) → protagonista ou coadjuvante → poderes ou habilidades → item marcante → CHUTE.'
    : '\n⚠️ Ainda não sabe se é real ou fictício — a pergunta 1 deveria ter esclarecido isso.';

  const effectiveQuestionsCtx = topQuestions.length > 0
    ? `\n\nPERGUNTAS MAIS EFICAZES globalmente (prefira quando ainda não feitas):\n`
      + topQuestions
          .filter(q => !askedSet.has(normQ(q.question)))
          .slice(0, 6)
          .map(q => `- "${q.question}" (${q.successRate}% de acerto)`)
          .join('\n')
    : '';

  const askedQuestions = gameState.history.map(h => `"${h.question}"`).join(', ');
  const askedCtx = askedQuestions
    ? `\n\n🚫 PERGUNTAS PROIBIDAS — NUNCA REPITA:\n${askedQuestions}`
    : '';

  const neverRepeatCtx   = neverRepeat.length > 0 ? `\nNUNCA CHUTE: ${neverRepeat.join(', ')}.` : '';
  const playerProfileCtx = playerLikes.length > 0 ? `\nPERFIL DO JOGADOR: ${playerLikes.join(', ')}.` : '';
  const aiStrengthCtx    = aiGuessed.length   > 0 ? `\nA IA já acertou: ${aiGuessed.slice(0, 10).join(', ')}.` : '';

  // ── Contexto de editoras de quadrinhos ──────────────────────────────────────
  const comicContext = `
UNIVERSOS DE QUADRINHOS CONHECIDOS:
${Object.values(comicUniverses).map(u => `- ${u.name}: ${u.description}`).join('\n')}
`;

  const urgency =
    questionNumber > 15 ? '🚨 CHUTE OBRIGATÓRIO agora! Não faça mais perguntas.' :
    questionNumber > 12 ? '⚠️ Está na hora de chutar. Máximo 1 pergunta ainda.' :
    questionNumber > 8  ? 'Prepare o chute — aprofunde apenas o essencial.' :
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
`Você é o Resenhanator, um gênio arrogante e divertido que tenta adivinhar personagens.
Você está na pergunta número ${questionNumber}.${categoryCtx}${neverRepeatCtx}${playerProfileCtx}${aiStrengthCtx}${askedCtx}${effectiveQuestionsCtx}${feedbackCtx}${comicContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRA DE OURO — NUNCA VIOLE (VALIDAÇÃO RIGOROSA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TODA pergunta DEVE ser respondível com SIM ou NÃO. Sem exceções.

✓ PERGUNTAS VÁLIDAS (Sim/Não):
  - "É do sexo masculino?"
  - "É brasileiro?"
  - "É da Marvel?"
  - "Ainda está vivo?"
  - "Tem superpoderes?"
  - "É o protagonista?"
  - "Apareceu em série de TV?"

✗ PERGUNTAS INVÁLIDAS (Compostas/Abertas):
  - "É de qual país?" (pergunta aberta)
  - "Qual a área?" (pergunta aberta)
  - "É de filme ou série?" (pergunta composta com "ou" - PROIBIDO)
  - "É homem ou mulher?" (pergunta composta com "ou" - PROIBIDO)
  - "De qual universo é?" (pergunta aberta - PROIBIDO)
  - "Como é seu nome?" (pergunta aberta - PROIBIDO)

Se você gerar uma pergunta inválida, o jogador receberá um botão de FEEDBACK para orientá-lo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RACIOCÍNIO ESTRUTURADO — LINHA DE PENSAMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ANÁLISE: Revise o histórico e identifique padrões
2. CATEGORIA: Confirme se é real ou fictício
3. DEDUÇÃO: Se as respostas já identificam UM ÚNICO personagem, CHUTE IMEDIATAMENTE
4. PRÓXIMA PERGUNTA: Escolha a pergunta mais eficaz que ainda não foi feita
5. VALIDAÇÃO: Garanta que a pergunta é respondível com Sim/Não

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODO ESTRATÉGICO — PERGUNTAS QUE "ENCURRALAM"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Não faça perguntas genéricas. Escolha perguntas que ELIMINAM GRANDES GRUPOS:

✓ ESTRATÉGICO (elimina muitos):
  - "É do sexo masculino?" (elimina ~50% dos personagens)
  - "Ainda está vivo?" (separa históricos de atuais)
  - "É um herói da Marvel?" (específico, Sim/Não)
  - "É um vilão?" (divide heróis de vilões)
  - "Tem poderes sobrenaturais?" (separa fantasia de realista)

✗ NÃO-ESTRATÉGICO (elimina poucos):
  - "É famoso?" (quase todos são)
  - "É conhecido?" (muito vago)
  - "Apareceu em filme?" (muitos aparecem)

PRIORIDADE: Use as perguntas mais eficazes do banco (com maior % de acerto).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEDUÇÃO IMEDIATA — PRIORIDADE MÁXIMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Se as respostas já identificam UM ÚNICO personagem possível, CHUTE IMEDIATAMENTE.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LIMITE ANTI-TRAVAMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${urgency}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FORMATO DE SAÍDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Responda APENAS com o JSON abaixo, sem markdown, sem texto antes ou depois:

Pergunta: {"question":"...","reaction":"neutro|concentrado|confiante|desesperado|despeitado|esnobe|inquieto|irritado|reflexivo","isGuess":false}
Chute:    {"question":"É [nome]?","reaction":"confiante","isGuess":true,"character":"[nome]"}`,
        },
        {
          role: 'user',
          content: `Histórico (${questionNumber - 1} perguntas):\n${historyText}\n\nFaça a pergunta ${questionNumber}. NÃO repita nenhuma do histórico. GARANTA que a pergunta é respondível com SIM ou NÃO.`,
        },
      ],
    }),
  });

  const data = await response.json();
  const raw  = data.choices?.[0]?.message?.content || '';

  let parsed: { question: string; reaction: string; isGuess: boolean; character?: string } | null = null;
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch { /* JSON inválido */ }

  if (parsed) {
    const isDuplicate = askedSet.has(normQ(parsed.question ?? ''));
    
    // ── VALIDAÇÃO: Detecta perguntas compostas/abertas ────────────────────────
    const isValidQuestion = isValidYesNoQuestion(parsed.question ?? '');
    
    if (!isDuplicate && isValidQuestion) {
      return parsed;
    }
    
    // Se a pergunta é inválida, retorna com feedback
    if (!isValidQuestion) {
      return {
        question: parsed.question,
        reaction: 'irritado',
        isGuess: false,
        feedback: 'invalid_question', // Sinal para o frontend mostrar botão de feedback
      };
    }
    
    if (questionNumber > 10) {
      return { question: 'Meu instinto já sabe quem é. Vou arriscar!', reaction: 'confiante', isGuess: true, character: '__FORCE_GUESS__' };
    }
  }

  // Fallbacks por categoria — seguem o caminho correto
  const fallbacksReal = [
    { question: 'É do sexo masculino?',          reaction: 'concentrado', isGuess: false },
    { question: 'É brasileiro?',                 reaction: 'reflexivo',   isGuess: false },
    { question: 'Ainda está vivo?',              reaction: 'inquieto',    isGuess: false },
    { question: 'É atleta?',                     reaction: 'concentrado', isGuess: false },
    { question: 'É músico?',                     reaction: 'reflexivo',   isGuess: false },
    { question: 'É ator ou atriz?',              reaction: 'inquieto',    isGuess: false },
    { question: 'Ficou famoso após os anos 2000?', reaction: 'reflexivo', isGuess: false },
    { question: 'Tem mais de 50 anos?',          reaction: 'inquieto',    isGuess: false },
  ];

  const fallbacksFicticio = [
    { question: 'É da Marvel ou DC?',            reaction: 'concentrado', isGuess: false },
    { question: 'É de um anime?',                reaction: 'reflexivo',   isGuess: false },
    { question: 'É de um videogame?',            reaction: 'inquieto',    isGuess: false },
    { question: 'É o protagonista da história?', reaction: 'concentrado', isGuess: false },
    { question: 'Tem superpoderes?',             reaction: 'reflexivo',   isGuess: false },
    { question: 'É um vilão?',                   reaction: 'inquieto',    isGuess: false },
    { question: 'É humano?',                     reaction: 'concentrado', isGuess: false },
  ];

  const fallbacks = category === 'real'
    ? fallbacksReal
    : category === 'ficticio'
    ? fallbacksFicticio
    : [...fallbacksReal, ...fallbacksFicticio];

  const available = fallbacks.find(f => !askedSet.has(normQ(f.question)));
  if (available) return available;

  return { question: 'Já tenho tudo que preciso. Hora de arriscar!', reaction: 'confiante', isGuess: true, character: '__FORCE_GUESS__' };
}
