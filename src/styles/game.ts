import { StyleSheet } from 'react-native';
import { colors } from './global';

export const gameStyles = StyleSheet.create({
  characterContainer: {
    position: 'relative',
    width: '100%',
    height: 320,
    alignItems: 'flex-start',
    paddingLeft: 20,
  },
  image: {
    width: 200,
    height: 300,
  },
  bubble: {
    position: 'absolute',
    right: 16,
    top: 30,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 180,
  },
  bubbleText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '500',
  },
  arrowRight: {
    position: 'absolute',
    left: -12,
    top: '40%',
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 12,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: colors.primary,
  },
  counter: {
    color: colors.gray,
    fontSize: 13,
    marginBottom: 16,
    marginTop: 8,
  },
  buttonsContainer: {
    width: '100%',
    gap: 10,
    paddingHorizontal: 20,
  },
  button: {
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    position: 'absolute',
    bottom: 20,
  },
});