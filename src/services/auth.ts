import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { auth, db } from './firebase';

WebBrowser.maybeCompleteAuthSession();

export async function register(name: string, email: string, password: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: name });
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    name,
    email,
    points: 0,
    createdAt: new Date(),
  });
  return userCredential.user;
}

export async function login(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function logout() {
  await signOut(auth);
}

export async function forgotPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function loginWithGoogle(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);

  const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

  if (!userDoc.exists()) {
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name: userCredential.user.displayName,
      email: userCredential.user.email,
      points: 0,
      createdAt: new Date(),
    });
  }

  return userCredential.user;
}