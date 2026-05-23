/**
 * feedbackService.ts
 *
 * Serviço para persistência de feedback da IA no Firestore.
 * Armazena erros, perguntas inválidas e dados para análise.
 *
 * Estrutura no Firestore:
 *
 * /aiFeedback/{feedbackId}
 *   timestamp: Timestamp
 *   type: "invalid_question" | "wrong_guess" | "strategy_feedback"
 *   question: string
 *   category: "real" | "ficticio"
 *   gameHistory: { question, answer }[]
 *   userRating?: number (1-5)
 *   userComment?: string
 *   aiReaction?: string
 *   updatedAt: Timestamp
 */

import {
  collection, addDoc, serverTimestamp,
  query, where, orderBy, limit, getDocs,
  updateDoc, doc,
} from 'firebase/firestore';
import { db } from './firebase';

export interface AIFeedback {
  id?: string;
  timestamp?: any;
  type: 'invalid_question' | 'wrong_guess' | 'strategy_feedback';
  question: string;
  category: 'real' | 'ficticio' | '';
  gameHistory: { question: string; answer: string }[];
  userRating?: number;
  userComment?: string;
  aiReaction?: string;
  updatedAt?: any;
}

/**
 * Salva feedback de pergunta inválida no Firestore
 */
export async function saveFeedbackInvalidQuestion(opts: {
  question: string;
  category: 'real' | 'ficticio' | '';
  gameHistory: { question: string; answer: string }[];
  aiReaction?: string;
  userRating?: number;
  userComment?: string;
}): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'aiFeedback'), {
      type: 'invalid_question',
      question: opts.question,
      category: opts.category,
      gameHistory: opts.gameHistory,
      aiReaction: opts.aiReaction || '',
      userRating: opts.userRating || 0,
      userComment: opts.userComment || '',
      timestamp: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('[feedbackService] Feedback salvo:', docRef.id);
    return docRef.id;
  } catch (err) {
    console.warn('[feedbackService] Erro ao salvar feedback:', err);
    return null;
  }
}

/**
 * Salva feedback de chute errado
 */
export async function saveFeedbackWrongGuess(opts: {
  guessedCharacter: string;
  actualCharacter: string;
  category: 'real' | 'ficticio' | '';
  gameHistory: { question: string; answer: string }[];
  userRating?: number;
  userComment?: string;
}): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'aiFeedback'), {
      type: 'wrong_guess',
      question: `Chutou "${opts.guessedCharacter}" mas era "${opts.actualCharacter}"`,
      category: opts.category,
      gameHistory: opts.gameHistory,
      userRating: opts.userRating || 0,
      userComment: opts.userComment || '',
      timestamp: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('[feedbackService] Feedback de chute errado salvo:', docRef.id);
    return docRef.id;
  } catch (err) {
    console.warn('[feedbackService] Erro ao salvar feedback de chute:', err);
    return null;
  }
}

/**
 * Salva feedback estratégico geral
 */
export async function saveFeedbackStrategy(opts: {
  question: string;
  category: 'real' | 'ficticio' | '';
  gameHistory: { question: string; answer: string }[];
  userComment: string;
  userRating?: number;
}): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'aiFeedback'), {
      type: 'strategy_feedback',
      question: opts.question,
      category: opts.category,
      gameHistory: opts.gameHistory,
      userComment: opts.userComment,
      userRating: opts.userRating || 0,
      timestamp: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('[feedbackService] Feedback estratégico salvo:', docRef.id);
    return docRef.id;
  } catch (err) {
    console.warn('[feedbackService] Erro ao salvar feedback estratégico:', err);
    return null;
  }
}

/**
 * Busca feedbacks recentes de perguntas inválidas
 * Útil para análise de quais perguntas a IA está errando mais
 */
export async function getRecentInvalidQuestionFeedback(
  limitCount = 50
): Promise<AIFeedback[]> {
  try {
    const q = query(
      collection(db, 'aiFeedback'),
      where('type', '==', 'invalid_question'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as AIFeedback),
    }));
  } catch (err) {
    console.warn('[feedbackService] Erro ao buscar feedbacks:', err);
    return [];
  }
}

/**
 * Busca feedbacks de chutes errados
 */
export async function getRecentWrongGuessFeedback(
  limitCount = 50
): Promise<AIFeedback[]> {
  try {
    const q = query(
      collection(db, 'aiFeedback'),
      where('type', '==', 'wrong_guess'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...(d.data() as AIFeedback),
    }));
  } catch (err) {
    console.warn('[feedbackService] Erro ao buscar feedbacks de chute:', err);
    return [];
  }
}

/**
 * Atualiza um feedback com rating e comentário do usuário
 */
export async function updateFeedbackRating(
  feedbackId: string,
  rating: number,
  comment: string
): Promise<boolean> {
  try {
    const ref = doc(db, 'aiFeedback', feedbackId);
    await updateDoc(ref, {
      userRating: rating,
      userComment: comment,
      updatedAt: serverTimestamp(),
    });

    console.log('[feedbackService] Feedback atualizado:', feedbackId);
    return true;
  } catch (err) {
    console.warn('[feedbackService] Erro ao atualizar feedback:', err);
    return false;
  }
}

/**
 * Análise: Busca as perguntas inválidas mais frequentes
 * Retorna um mapa de pergunta → quantidade de vezes que foi inválida
 */
export async function analyzeInvalidQuestions(): Promise<
  { question: string; count: number }[]
> {
  try {
    const feedbacks = await getRecentInvalidQuestionFeedback(200);

    const questionMap = new Map<string, number>();
    for (const feedback of feedbacks) {
      const q = feedback.question || 'desconhecida';
      questionMap.set(q, (questionMap.get(q) || 0) + 1);
    }

    // Ordena por frequência decrescente
    return Array.from(questionMap.entries())
      .map(([question, count]) => ({ question, count }))
      .sort((a, b) => b.count - a.count);
  } catch (err) {
    console.warn('[feedbackService] Erro ao analisar perguntas:', err);
    return [];
  }
}

/**
 * Análise: Estatísticas gerais de feedback
 */
export async function getFeedbackStats(): Promise<{
  totalInvalidQuestions: number;
  totalWrongGuesses: number;
  totalStrategyFeedback: number;
  averageRating: number;
}> {
  try {
    const [invalid, wrongGuess, strategy] = await Promise.all([
      getRecentInvalidQuestionFeedback(1000),
      getRecentWrongGuessFeedback(1000),
      query(
        collection(db, 'aiFeedback'),
        where('type', '==', 'strategy_feedback'),
        orderBy('timestamp', 'desc'),
        limit(1000)
      ),
    ]);

    const strategySnap = await getDocs(strategy);
    const strategyFeedback = strategySnap.docs.map(d => d.data() as AIFeedback);

    // Calcula rating médio
    const allFeedbacks = [...invalid, ...wrongGuess, ...strategyFeedback];
    const ratings = allFeedbacks
      .filter(f => f.userRating && f.userRating > 0)
      .map(f => f.userRating || 0);
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

    return {
      totalInvalidQuestions: invalid.length,
      totalWrongGuesses: wrongGuess.length,
      totalStrategyFeedback: strategyFeedback.length,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  } catch (err) {
    console.warn('[feedbackService] Erro ao calcular stats:', err);
    return {
      totalInvalidQuestions: 0,
      totalWrongGuesses: 0,
      totalStrategyFeedback: 0,
      averageRating: 0,
    };
  }
}
