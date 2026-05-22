// Busca imagem do personagem via Wikipedia (sem API key necessária)
export async function searchCharacterImage(characterName: string): Promise<string | null> {
  try {
    // Tenta busca em português primeiro, depois inglês
    for (const lang of ['pt', 'en']) {
      const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(characterName)}&prop=pageimages&format=json&pithumbsize=400&origin=*`;
      
      const res = await fetch(searchUrl);
      const data = await res.json();
      
      const pages = data?.query?.pages;
      if (!pages) continue;
      
      const page = Object.values(pages)[0] as any;
      if (page?.thumbnail?.source) {
        return page.thumbnail.source;
      }
    }

    // Fallback: busca mais genérica pelo título da página
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(characterName)}&format=json&origin=*`;
    const res = await fetch(searchUrl);
    const data = await res.json();

    const firstResult = data?.query?.search?.[0];
    if (!firstResult) return null;

    const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(firstResult.title)}&prop=pageimages&format=json&pithumbsize=400&origin=*`;
    const pageRes = await fetch(pageUrl);
    const pageData = await pageRes.json();

    const pages = pageData?.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as any;
    return page?.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}
