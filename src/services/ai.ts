/**
 * ai.ts — Orquestrador de IA com Fallback Sequencial
 * Prioridade: Gemini → Groq
 */

import { getNextQuestion as getNextQuestionGroq, GameState, isValidYesNoQuestion } from './groq';
import { getNextQuestion as getNextQuestionGemini } from './gemini';

export { GameState, isValidYesNoQuestion };

export async function getNextQuestion(
  gameState: GameState,
  invalidQuestions: string[] = []
): Promise<{
  question: string;
  reaction: string;
  isGuess: boolean;
  character?: string;
  feedback?: string;
}> {
  // 1ª tentativa: Gemini (prioridade)
  try {
    console.log('🤖 [ORQUESTRADOR AI] Tentando obter próxima pergunta via Gemini...');
    return await getNextQuestionGemini(gameState, invalidQuestions);
  } catch (error: any) {
    const errorMsg = String(error?.message || error).toUpperCase();

    const isQuotaError =
      errorMsg.includes('TOKEN_LIMIT_EXCEEDED') ||
      errorMsg.includes('429') ||
      errorMsg.includes('RATE_LIMIT') ||
      errorMsg.includes('QUOTA');

    if (!isQuotaError) throw error; // Erro inesperado — não tenta fallback

    console.warn('⚠️ [ORQUESTRADOR AI] Gemini atingiu o limite. Alternando para Groq...');
  }

  // 2ª tentativa: Groq (fallback)
  try {
    console.log('🤖 [ORQUESTRADOR AI] Tentando obter próxima pergunta via Groq...');
    return await getNextQuestionGroq(gameState, invalidQuestions);
  } catch (error: any) {
    console.error('🚨 [ORQUESTRADOR AI] Groq também falhou:', error?.message || error);
    throw error; // Game.tsx captura e usa o fallback local definitivo
  }
}