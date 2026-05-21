import { StyleSheet } from 'react-native';
import { colors } from './global';

export const splashStyles = StyleSheet.create({
  image: {
    width: 280,
    height: 350,
    resizeMode: 'contain',
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});