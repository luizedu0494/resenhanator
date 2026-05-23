import {
  collection, addDoc, query, orderBy,
  limit, getDocs, doc, setDoc, getDoc, serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';

export interface FeedEntry {
  id: string;
  uid: string;
  playerName: string;
  character: string;
  won: boolean;
  questions: number;
  createdAt: number; 
}

export interface RankEntry {
  uid: string;
  playerName: string;
  wins: number;
  total: number;
  winRate: number; 
  bestStreak: number;
}


export async function publishResult(opts: {
  character: string;
  won: boolean;
  questions: number;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const playerName = user.displayName || 'Jogador anônimo';

  await addDoc(collection(db, 'feed'), {
    uid:        user.uid,
    playerName,
    character:  opts.character,
    won:        opts.won,
    questions:  opts.questions,
    createdAt:  serverTimestamp(),
  });

  await updateRankStats(user.uid, playerName, opts.won);
}

export async function loadFeed(limitCount = 20): Promise<FeedEntry[]> {
  const q = query(
    collection(db, 'feed'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id:         d.id,
    uid:        d.data().uid,
    playerName: d.data().playerName,
    character:  d.data().character,
    won:        d.data().won,
    questions:  d.data().questions,
    createdAt:  d.data().createdAt?.toMillis?.() ?? Date.now(),
  }));
}


async function updateRankStats(uid: string, playerName: string, won: boolean): Promise<void> {
  const ref  = doc(db, 'ranking', uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const d = snap.data();
    const newWins  = d.wins  + (won ? 1 : 0);
    const newTotal = d.total + 1;
    await setDoc(ref, {
      playerName,
      wins:     newWins,
      total:    newTotal,
      winRate:  Math.round((newWins / newTotal) * 100),
   
      currentStreak: won ? (d.currentStreak || 0) + 1 : 0,
      bestStreak:    won
        ? Math.max(d.bestStreak || 0, (d.currentStreak || 0) + 1)
        : (d.bestStreak || 0),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } else {
    await setDoc(ref, {
      playerName,
      wins:          won ? 1 : 0,
      total:         1,
      winRate:       won ? 100 : 0,
      currentStreak: won ? 1 : 0,
      bestStreak:    won ? 1 : 0,
      updatedAt:     serverTimestamp(),
    });
  }
}

export async function loadRanking(limitCount = 10): Promise<RankEntry[]> {
  const q = query(
    collection(db, 'ranking'),
    orderBy('wins', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    uid:         d.id,
    playerName:  d.data().playerName,
    wins:        d.data().wins,
    total:       d.data().total,
    winRate:     d.data().winRate,
    bestStreak:  d.data().bestStreak,
  }));
}