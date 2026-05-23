// Aliases para personagens que têm nomes diferentes na Wikipedia
const WIKI_ALIASES: Record<string, string> = {
  'goku': 'Son Goku',
  'vegeta': 'Vegeta',
  'naruto': 'Naruto Uzumaki',
  'luffy': 'Monkey D. Luffy',
  'sasuke': 'Sasuke Uchiha',
  'eren': 'Eren Yeager',
  'homem aranha': 'Spider-Man',
  'homem de ferro': 'Iron Man',
  'capitão américa': 'Captain America',
  'capitão america': 'Captain America',
  'coringa': 'Joker (character)',
  'batman': 'Batman',
  'superman': 'Superman',
  'mulher maravilha': 'Wonder Woman',
  'pantera negra': 'Black Panther (Marvel Comics)',
  'deadpool': 'Deadpool (comics)',
  'thor': 'Thor (Marvel Comics)',
  'hulk': 'Hulk (comics)',
  'viúva negra': 'Black Widow (Marvel Comics)',
  'anitta': 'Anitta (singer)',
  'neymar': 'Neymar',
  'ronaldo': 'Ronaldo (Brazilian footballer)',
  'ronaldinho': 'Ronaldinho',
  'pelé': 'Pelé',
  'pele': 'Pelé',
  'lula': 'Luiz Inácio Lula da Silva',
  'bolsonaro': 'Jair Bolsonaro',
  'pikachu': 'Pikachu',
  'sonic': 'Sonic the Hedgehog',
  'mario': 'Mario (character)',
  'link': 'Link (The Legend of Zelda)',
  'kratos': 'Kratos (God of War)',
  'master chief': 'Master Chief (Halo)',
};

function resolveWikiTitle(name: string): string {
  const lower = name.toLowerCase().trim();
  return WIKI_ALIASES[lower] ?? name;
}

// Busca imagem na Wikipedia por título exato
async function wikiByTitle(title: string): Promise<string | null> {
  for (const lang of ['en', 'pt']) {
    try {
      const url = `https://${lang}.wikipedia.org/w/api.php?` +
        `action=query&titles=${encodeURIComponent(title)}&prop=pageimages` +
        `&format=json&pithumbsize=500&origin=*`;
      const res  = await fetch(url);
      const data = await res.json();
      const page = Object.values(data?.query?.pages ?? {})[0] as any;
      if (page?.pageid > 0 && page?.thumbnail?.source) return page.thumbnail.source;
    } catch {}
  }
  return null;
}

// Busca textual na Wikipedia e pega imagem do primeiro resultado com foto
async function wikiBySearch(query: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?` +
      `action=query&list=search&srsearch=${encodeURIComponent(query)}` +
      `&format=json&origin=*&srlimit=5`;
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

// DuckDuckGo instant answer — retorna imagem quando disponível
async function duckDuckGoImage(query: string): Promise<string | null> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data?.Image && data.Image.startsWith('http')) return data.Image;
    // Tenta nos resultados relacionados
    for (const r of (data?.RelatedTopics ?? [])) {
      if (r?.Icon?.URL && r.Icon.URL.startsWith('http')) return r.Icon.URL;
    }
  } catch {}
  return null;
}

export async function searchCharacterImage(characterName: string): Promise<string | null> {
  const wikiTitle = resolveWikiTitle(characterName);

  // 1. Wikipedia pelo título resolvido (alias ou nome direto)
  const byAlias = await wikiByTitle(wikiTitle);
  if (byAlias) return byAlias;

  // 2. Wikipedia busca textual: nome original
  const bySearch = await wikiBySearch(characterName);
  if (bySearch) return bySearch;

  // 3. Wikipedia busca com "character" / "singer" / "footballer"
  const byCharacter = await wikiBySearch(`${characterName} character`);
  if (byCharacter) return byCharacter;

  // 4. DuckDuckGo como último recurso
  const byDDG = await duckDuckGoImage(characterName);
  if (byDDG) return byDDG;

  return null;
}