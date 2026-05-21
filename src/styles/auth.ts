import { StyleSheet } from 'react-native';
import { colors } from './global';

export const authStyles = StyleSheet.create({
  image: {
    width: 150,
    height: 180,
    marginBottom: 10,
  },
  form: {
    width: '100%',
    gap: 12,
    marginVertical: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#1e1e24',
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#2e2e3a',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 13,
  },
  registerLink: {
    marginTop: 20,
  },
  registerLinkText: {
    color: colors.gray,
    fontSize: 14,
  },
  registerLinkBold: {
    color: colors.primary,
    fontWeight: '600',
  },
});