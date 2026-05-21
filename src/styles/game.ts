import { StyleSheet } from 'react-native';

export const gameStyles = StyleSheet.create({
  characterContainer: {
    position: 'relative',
    width: 300,
    height: 320,
    alignItems: 'center',
  },
  image: {
    width: 300,
    height: 320,
  },
  bubble: {
    position: 'absolute',
    right: -140,
    top: 40,
    backgroundColor: '#8257e5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 150,
  },
  bubbleText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 20,
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
    borderRightColor: '#8257e5',
  },
  counter: {
    color: '#8d8d99',
    fontSize: 13,
    marginBottom: 16,
    marginTop: -8,
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
});