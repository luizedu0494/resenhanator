import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = 'resenhanator:history';
const MAX_ITEMS   = 30;

export interface HistoryEntry {
  id: string;
  character: string;           // chute da IA
  revealedCharacter?: string;  // personagem real revelado pelo usuário quando a IA errou
  won: boolean;
  questions: number;
  date: string;
}

export async function saveResult(entry: Omit<HistoryEntry, 'id' | 'date'>): Promise<void> {
  const current = await loadHistory();
  const newEntry: HistoryEntry = {
    ...entry,
    id: Date.now().toString(),
    date: new Date().toISOString(),
  };
  const updated = [newEntry, ...current].slice(0, MAX_ITEMS);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export async function revealCharacter(id: string, revealedCharacter: string): Promise<void> {
  const current = await loadHistory();
  const updated  = current.map(e =>
    e.id === id ? { ...e, revealedCharacter } : e
  );
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}