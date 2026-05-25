/**
 * ai.ts — Orquestrador de IA com Fallback Sequencial
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
  try {
    console.log('🤖 [ORQUESTRADOR AI] Tentando obter próxima pergunta via Groq...');
    return await getNextQuestionGroq(gameState, invalidQuestions);
  } catch (error: any) {
    const errorMsg = String(error?.message || error).toUpperCase();
    
    // Detecta se o erro foi por falta de tokens, limite de requisições (429) ou erro do servidor da Groq
    if (
      errorMsg.includes('TOKEN_LIMIT_EXCEEDED') ||
      errorMsg.includes('429') ||
      errorMsg.includes('RATE_LIMIT') ||
      errorMsg.includes('QUOTA')
    ) {
      console.warn('⚠️ [ORQUESTRADOR AI] Groq atingiu o limite ou falhou. Alternando para o Gemini...');
      
      try {
        return await getNextQuestionGemini(gameState, invalidQuestions);
      } catch (geminiError: any) {
        console.error('🚨 [ORQUESTRADOR AI] Gemini também falhou:', geminiError?.message || geminiError);
        throw geminiError; // Se ambos falharem, o Game.tsx vai capturar e usar o fallback local definitivo
      }
    }
    
    // Se for outro tipo de erro que não seja cota/tokens, repassa para frente
    throw error;
  }
}