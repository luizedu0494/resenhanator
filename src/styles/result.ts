import { StyleSheet } from 'react-native';
import { colors } from './global';

export const resultStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  // Cabeçalho de resultado
  outcomeLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  outcomeLabelWon: { color: '#2ecc71' },
  outcomeLabelLost: { color: '#e74c3c' },

  headline: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 34,
  },

  // Área da imagem (foto do personagem ou gênio)
  imageWrapper: {
    width: 220,
    height: 260,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 2,
  },
  imageWrapperWon: { borderColor: '#2ecc71' },
  imageWrapperLost: { borderColor: '#e74c3c' },

  characterImage: {
    width: '100%',
    height: '100%',
  },

  // Nome do personagem
  characterName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  characterSub: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: 32,
  },

  // Botões de ação
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btnPrimary: {
    flex: 1,
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  btnSecondaryText: {
    color: colors.gray,
    fontWeight: '600',
    fontSize: 15,
  },

  // Loading da imagem
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e1e24',
  },
});
