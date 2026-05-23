/**
 * imageSearch.ts — cascata inteligente de busca de imagem
 *
 * Ordem:
 *  1. Jikan (MyAnimeList)   — anime/mangá
 *  2. TMDB person search    — pessoas reais (atores, músicos via créditos)
 *  3. Wikipedia             — personagens fictícios e celebridades
 *  4. DuckDuckGo            — fallback final
 *
 * Para personagens fictícios o TMDB é BLOQUEADO por padrão
 * (retorna poster da obra, não o personagem).
 */

// ─── Aliases Wikipedia ───────────────────────────────────────────────────────
const WIKI_ALIASES: Record<string, string> = {
  // Animes / mangás
  'goku': 'Son Goku', 'vegeta': 'Vegeta', 'naruto': 'Naruto Uzumaki',
  'luffy': 'Monkey D. Luffy', 'sasuke': 'Sasuke Uchiha', 'sakura': 'Sakura Haruno',
  'eren': 'Eren Yeager', 'levi': 'Levi Ackerman', 'mikasa': 'Mikasa Ackerman',
  'tanjiro': 'Tanjiro Kamado', 'zenitsu': 'Zenitsu Agatsuma',
  'deku': 'Izuku Midoriya', 'bakugo': 'Katsuki Bakugo', 'todoroki': 'Shoto Todoroki',
  'saitama': 'Saitama (One-Punch Man)', 'genos': 'Genos', 'mob': 'Shigeo Kageyama',
  'light yagami': 'Light Yagami', 'l lawliet': 'L (Death Note)',
  'spike spiegel': 'Spike Spiegel', 'edward elric': 'Edward Elric',
  'alphonse elric': 'Alphonse Elric', 'ichigo': 'Ichigo Kurosaki',
  'rukia': 'Rukia Kuchiki', 'gon freecss': 'Gon Freecss', 'killua': 'Killua Zoldyck',
  // Cartoons ocidentais
  'salsicha': 'Shaggy Rogers', 'scooby': 'Scooby-Doo', 'fred': 'Fred Jones (Scooby-Doo)',
  'vilma': 'Velma Dinkley', 'daphne': 'Daphne Blake',
  'homer': 'Homer Simpson', 'bart': 'Bart Simpson', 'lisa': 'Lisa Simpson',
  'marge': 'Marge Simpson', 'maggie': 'Maggie Simpson',
  'peter griffin': 'Peter Griffin', 'stewie': 'Stewie Griffin',
  'eric cartman': 'Eric Cartman', 'stan marsh': 'Stan Marsh',
  'bob esponja': 'SpongeBob SquarePants', 'patrick': 'Patrick Star',
  'lula molusco': 'Squidward Tentacles', 'sandy': 'Sandy Cheeks',
  'pica-pau': 'Woody Woodpecker', 'patolino': 'Daffy Duck',
  'pernalonga': 'Bugs Bunny', 'perna longa': 'Bugs Bunny',
  'tom': 'Tom Cat', 'jerry': 'Jerry Mouse',
  'popeye': 'Popeye', 'olive': 'Olive Oyl',
  'mickey': 'Mickey Mouse', 'minnie': 'Minnie Mouse',
  'pato donald': 'Donald Duck', 'pluto': 'Pluto (Disney)',
  'timon': 'Timon (The Lion King)', 'pumba': 'Pumbaa',
  'simba': 'Simba', 'mufasa': 'Mufasa',
  'shrek': 'Shrek', 'fiona': 'Princess Fiona',
  'buzz lightyear': 'Buzz Lightyear', 'woody': 'Woody (Toy Story)',
  'nemo': 'Nemo (Finding Nemo)', 'dory': 'Dory (Finding Nemo)',
  'wall-e': 'WALL-E', 'eva': 'EVE (WALL-E)',
  'linguini': 'Linguini', 'remy': 'Remy (Ratatouille)',
  'elsa': 'Elsa (Frozen)', 'anna': 'Anna (Frozen)',
  'moana': 'Moana (character)', 'maui': 'Maui (Moana)',
  'rapunzel': 'Rapunzel', 'pascal': 'Pascal (Tangled)',
  'bela': 'Belle (Beauty and the Beast)',
  'cinderela': 'Cinderella', 'branca de neve': 'Snow White',
  'aladdin': 'Aladdin (character)', 'jasmine': 'Jasmine (Aladdin)',
  'ariel': 'Ariel (The Little Mermaid)',
  // Super-heróis
  'homem aranha': 'Spider-Man', 'homem de ferro': 'Iron Man',
  'capitão américa': 'Captain America', 'capitão america': 'Captain America',
  'hulk': 'Hulk (comics)', 'thor': 'Thor (Marvel Comics)',
  'viúva negra': 'Black Widow (Marvel Comics)',
  'pantera negra': 'Black Panther (Marvel Comics)',
  'doutor estranho': 'Doctor Strange', 'feiticeira escarlate': 'Scarlet Witch',
  'deadpool': 'Deadpool (comics)', 'wolverine': 'Wolverine (character)',
  'ciclope': 'Cyclops (Marvel Comics)', 'tempestade': 'Storm (Marvel Comics)',
  'batman': 'Batman', 'superman': 'Superman', 'coringa': 'Joker (character)',
  'mulher maravilha': 'Wonder Woman', 'flash': 'Flash (DC Comics)',
  'aquaman': 'Aquaman', 'lanterna verde': 'Green Lantern',
  'lex luthor': 'Lex Luthor', 'duas-caras': 'Two-Face',
  'spawn': 'Spawn (comics)', 'hellboy': 'Hellboy',
  // Games
  'mario': 'Mario (character)', 'luigi': 'Luigi', 'peach': 'Princess Peach',
  'bowser': 'Bowser', 'yoshi': 'Yoshi', 'toad': 'Toad (Nintendo)',
  'link': 'Link (The Legend of Zelda)', 'zelda': 'Princess Zelda',
  'ganon': 'Ganon', 'samus': 'Samus Aran', 'kirby': 'Kirby (character)',
  'pikachu': 'Pikachu', 'mewtwo': 'Mewtwo', 'charizard': 'Charizard',
  'sonic': 'Sonic the Hedgehog', 'tails': 'Tails (Sonic)',
  'kratos': 'Kratos (God of War)', 'master chief': 'Master Chief (Halo)',
  'cloud strife': 'Cloud Strife', 'tifa': 'Tifa Lockhart',
  'lara croft': 'Lara Croft', 'nathan drake': 'Nathan Drake',
  'geralt': 'Geralt of Rivia', 'ciri': 'Ciri (Witcher)',
  'arthur morgan': 'Arthur Morgan', 'joel': 'Joel (The Last of Us)',
  'ellie': 'Ellie (The Last of Us)',
  // Pessoas reais brasileiras
  'anitta': 'Anitta (singer)', 'neymar': 'Neymar',
  'ronaldo': 'Ronaldo (Brazilian footballer)', 'ronaldinho': 'Ronaldinho',
  'pelé': 'Pelé', 'pele': 'Pelé', 'zico': 'Zico',
  'cafu': 'Cafu', 'roberto carlos': 'Roberto Carlos (footballer)',
  'lula': 'Luiz Inácio Lula da Silva', 'bolsonaro': 'Jair Bolsonaro',
  'dilma': 'Dilma Rousseff', 'fhc': 'Fernando Henrique Cardoso',
  'xuxa': 'Xuxa', 'silvio santos': 'Silvio Santos',
  'faustao': 'Fausto Silva', 'galvao bueno': 'Galvão Bueno',
  'boninho': 'Boninho', 'luciano huck': 'Luciano Huck',
  'ivete sangalo': 'Ivete Sangalo', 'claudia leitte': 'Claudia Leitte',
  'mc kevinho': 'MC Kevinho', 'mc hariel': 'MC Hariel',
  'kevinho': 'MC Kevinho', 'ludmilla': 'Ludmilla (singer)',
  // Pessoas reais globais
  'messi': 'Lionel Messi', 'cristiano ronaldo': 'Cristiano Ronaldo',
  'lebron': 'LeBron James', 'michael jordan': 'Michael Jordan',
  'kobe': 'Kobe Bryant', 'tyson': 'Mike Tyson',
  'drake': 'Drake (musician)', 'beyonce': 'Beyoncé',
  'rihanna': 'Rihanna', 'taylor swift': 'Taylor Swift',
  'lady gaga': 'Lady Gaga', 'ariana grande': 'Ariana Grande',
  'eminem': 'Eminem', 'kanye': 'Kanye West',
  'elon musk': 'Elon Musk', 'bill gates': 'Bill Gates',
  'einstein': 'Albert Einstein', 'newton': 'Isaac Newton',
};

function resolveWikiTitle(name: string): string {
  return WIKI_ALIASES[name.toLowerCase().trim()] ?? name;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function log(msg: string) { console.log(`[imageSearch] ${msg}`); }

// ─── Tipos de hints ───────────────────────────────────────────────────────────
export interface ImageSearchHints {
  isReal?:         boolean;
  isAnime?:        boolean;
  isManga?:        boolean;
  isManhua?:       boolean; // manhwa/manhua (coreano/chinês)
  isCartoon?:      boolean;
  isGame?:         boolean;
  isMarvel?:       boolean;
  isDC?:           boolean;
  isSerie?:        boolean;
  isFilme?:        boolean;
  isDisney?:       boolean;
  isLivro?:        boolean;
  isAtleta?:       boolean;
  isMusico?:       boolean;
  isAtor?:         boolean;
  isApresentador?: boolean;
  isPolitico?:     boolean;
  isCientistaArtista?: boolean;
  area?:           string;
}

export function hintsFromHistory(
  history: { question: string; answer: string }[]
): ImageSearchHints {
  const yes = (kw: string) => history.some(h =>
    h.question.toLowerCase().includes(kw) &&
    (h.answer === 'Sim' || h.answer === 'Prov. sim'));

  return {
    isReal:          yes('pessoa real'),
    isAnime:         yes('anime'),
    isManga:         yes('mangá') || yes('manga'),
    isManhua:        yes('manhwa') || yes('manhua'),
    isCartoon:       yes('cartoon') || yes('desenho animado') || yes('animação ocidental'),
    isGame:          yes('videogame') || yes('jogo'),
    isMarvel:        yes('marvel'),
    isDC:            yes('dc comics') || yes('dc '),
    isSerie:         yes('série de tv') || yes('serie de tv'),
    isFilme:         yes('filme') && !yes('anime') && !yes('cartoon'),
    isDisney:        yes('disney'),
    isLivro:         yes('livro') || yes('romance') || yes('literatura'),
    isAtleta:        yes('atleta') || yes('futebol') || yes('esporte'),
    isMusico:        yes('músico') || yes('cantor') || yes('banda'),
    isAtor:          yes('ator') || yes('atriz') || yes('novela'),
    isApresentador:  yes('apresentador'),
    isPolitico:      yes('político') || yes('presidente') || yes('governador'),
    isCientistaArtista: yes('cientista') || yes('artista plástico') || yes('escritor'),
  };
}

// ─── 1. Jikan (MyAnimeList) — anime e mangá ───────────────────────────────────
async function jikanSearch(name: string): Promise<string | null> {
  try {
    const url  = `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(name)}&limit=3`;
    const res  = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const char = data?.data?.[0];
    return char?.images?.jpg?.image_url ?? char?.images?.webp?.image_url ?? null;
  } catch { return null; }
}

// ─── 2. TMDB — SÓ para pessoas reais ─────────────────────────────────────────
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG  = 'https://image.tmdb.org/t/p/w500';

async function tmdbPerson(name: string): Promise<string | null> {
  const key = process.env.EXPO_PUBLIC_TMDB_API_KEY;
  if (!key) return null;
  try {
    const url    = `${TMDB_BASE}/search/person?api_key=${key}&query=${encodeURIComponent(name)}&language=pt-BR`;
    const res    = await fetch(url);
    const data   = await res.json();
    const person = (data?.results ?? []).find((p: any) => p.profile_path);
    return person ? `${TMDB_IMG}${person.profile_path}` : null;
  } catch { return null; }
}

// ─── 3. Wikipedia ─────────────────────────────────────────────────────────────
async function wikiByTitle(title: string): Promise<string | null> {
  for (const lang of ['pt', 'en']) {
    try {
      const url  = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
      const res  = await fetch(url);
      const data = await res.json();
      const page = Object.values(data?.query?.pages ?? {})[0] as any;
      if (page?.pageid > 0 && page?.thumbnail?.source) return page.thumbnail.source;
    } catch {}
  }
  return null;
}

async function wikiBySearch(query: string): Promise<string | null> {
  try {
    const url     = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=5`;
    const res     = await fetch(url);
    const data    = await res.json();
    const results = (data?.query?.search ?? []) as any[];
    for (const r of results) {
      const img = await wikiByTitle(r.title);
      if (img) return img;
    }
  } catch {}
  return null;
}

// Monta queries progressivas e específicas para o tipo de personagem
function buildWikiQueries(name: string, hints: ImageSearchHints): string[] {
  const q: string[] = [];

  if (hints.isAnime || hints.isManga)
    q.push(`${name} anime character`, `${name} manga character`, name);
  else if (hints.isManhua)
    q.push(`${name} manhwa character`, `${name} webtoon`, name);
  else if (hints.isCartoon)
    // Para cartoons: busca direta com "character" antes de qualquer obra
    q.push(`${name} cartoon character`, `${name} animated character`, name);
  else if (hints.isGame)
    q.push(`${name} video game character`, `${name} game character`, name);
  else if (hints.isMarvel)
    q.push(`${name} Marvel Comics`, `${name} Marvel character`, name);
  else if (hints.isDC)
    q.push(`${name} DC Comics`, `${name} DC character`, name);
  else if (hints.isLivro)
    q.push(`${name} fictional character`, `${name} literary character`, name);
  else if (hints.isSerie)
    q.push(`${name} fictional character`, `${name} TV character`, name);
  else if (hints.isFilme)
    q.push(`${name} fictional character`, `${name} film character`, name);
  else if (hints.isReal) {
    if (hints.isAtleta)       q.push(`${name} footballer`, `${name} athlete`, `${name} player`);
    else if (hints.isMusico)  q.push(`${name} singer`, `${name} musician`, `${name} rapper`);
    else if (hints.isAtor)    q.push(`${name} actor`, `${name} actress`, `${name} novela`);
    else if (hints.isPolitico)q.push(`${name} politician`, `${name} president`);
    else                      q.push(`${name} celebrity`, `${name} Brazilian`, name);
  } else {
    // Desconhecido — tenta character antes de qualquer obra
    q.push(`${name} character`, name, `${name} fictional`);
  }

  return q;
}

// ─── 4. DuckDuckGo ───────────────────────────────────────────────────────────
async function duckDuckGoImage(query: string): Promise<string | null> {
  try {
    const url  = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data?.Image?.startsWith('http')) return data.Image;
    for (const r of (data?.RelatedTopics ?? [])) {
      if (r?.Icon?.URL?.startsWith('http') && !r.Icon.URL.includes('duckduckgo.com/i/')) {
        return r.Icon.URL;
      }
    }
  } catch {}
  return null;
}

// ─── Função principal ─────────────────────────────────────────────────────────
export async function searchCharacterImage(
  characterName: string,
  hints: ImageSearchHints = {}
): Promise<string | null> {
  const name      = characterName.trim();
  const wikiTitle = resolveWikiTitle(name);
  const isFictional = !hints.isReal;

  log(`"${name}" | real=${hints.isReal} cartoon=${hints.isCartoon} anime=${hints.isAnime} game=${hints.isGame}`);

  // 1. Anime/mangá/manhwa → Jikan primeiro
  if (hints.isAnime || hints.isManga || hints.isManhua) {
    const jikan = await jikanSearch(name);
    if (jikan) { log('✅ Jikan'); return jikan; }
  }

  // 2. Pessoa real → TMDB person search (retorna foto da pessoa, não poster)
  if (hints.isReal) {
    const tmdb = await tmdbPerson(name);
    if (tmdb) { log('✅ TMDB person'); return tmdb; }
  }
  // NÃO usa TMDB para fictícios (retornaria poster da obra, não o personagem)

  // 3. Wikipedia com alias
  if (wikiTitle !== name) {
    const byAlias = await wikiByTitle(wikiTitle);
    if (byAlias) { log('✅ Wiki alias'); return byAlias; }
  }

  // 4. Wikipedia com queries contextuais
  const queries = buildWikiQueries(name, hints);
  for (const q of queries) {
    const img = await wikiBySearch(q);
    if (img) { log(`✅ Wiki: "${q}"`); return img; }
  }

  // 5. Jikan como fallback pra qualquer fictício (cobre cartoons às vezes)
  if (isFictional && !hints.isAnime) {
    const jikan = await jikanSearch(name);
    if (jikan) { log('✅ Jikan fallback'); return jikan; }
  }

  // 6. DuckDuckGo
  const ddgQ = hints.isReal
    ? `${name} famoso`
    : hints.isCartoon
    ? `${name} cartoon character`
    : `${name} personagem`;
  const ddg = await duckDuckGoImage(ddgQ);
  if (ddg) { log('✅ DuckDuckGo'); return ddg; }

  log('❌ Sem imagem');
  return null;
}