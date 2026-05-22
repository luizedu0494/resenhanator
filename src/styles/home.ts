import { StyleSheet } from 'react-native';
import { colors } from './global';

export const homeStyles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: colors.background,
  },

  image: {
    width: 220,
    height: 260,
    resizeMode: 'contain',
  },

  historySection: {
    width: '100%',
    marginTop: 32,
  },
  scoreboard: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e1e24',
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 24,
    gap: 0,
  },
  scoreItem: {
    flex: 1,
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2ecc71',
  },
  scoreNumberLoss: {
    color: '#e74c3c',
  },
  scoreLabel: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scoreDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#2e2e36',
  },

  // Lista
  historyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e24',
    gap: 12,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWon:  { backgroundColor: '#1a6b2a' },
  badgeLost: { backgroundColor: '#8b0000' },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  historyInfo: {
    flex: 1,
  },
  historyCharacter: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  historyMeta: {
    color: colors.gray,
    fontSize: 12,
    marginTop: 2,
  },
});