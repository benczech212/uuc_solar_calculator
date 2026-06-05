import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { SolarParams } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Error signing in with Google", error);
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

export interface SavedConfig {
  id: string;
  userId: string;
  title: string;
  description: string;
  params: SolarParams;
  createdAt: any;
  updatedAt: any;
  isPublic?: boolean;
}

export const saveConfiguration = async (params: SolarParams, title: string, description: string = '', isPublic: boolean = false) => {
  if (!auth.currentUser) throw new Error("Must be logged in to save configuration");
  
  const id = crypto.randomUUID();
  const configRef = doc(db, 'savedConfigs', id);
  
  const config = {
    id,
    userId: auth.currentUser.uid,
    title,
    description,
    params,
    isPublic,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  await setDoc(configRef, config);
  return id;
};

export const updateConfiguration = async (id: string, params: SolarParams, title: string, description: string, isPublic: boolean) => {
  if (!auth.currentUser) throw new Error("Must be logged in");
  
  const configRef = doc(db, 'savedConfigs', id);
  await updateDoc(configRef, {
    params,
    title,
    description,
    isPublic,
    updatedAt: serverTimestamp()
  });
};

export const getConfiguration = async (id: string): Promise<SavedConfig | null> => {
  const configRef = doc(db, 'savedConfigs', id);
  const snapshot = await getDoc(configRef);
  if (snapshot.exists()) {
    return snapshot.data() as SavedConfig;
  }
  return null;
};

export const getUserConfigurations = async (): Promise<SavedConfig[]> => {
  if (!auth.currentUser) return [];
  const q = query(collection(db, 'savedConfigs'), where('userId', '==', auth.currentUser.uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as SavedConfig);
};

export const getPublicConfigurations = async (): Promise<SavedConfig[]> => {
  const q = query(collection(db, 'savedConfigs'), where('isPublic', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as SavedConfig);
};

export const getAllConfigurationsAdmin = async (): Promise<SavedConfig[]> => {
  if (!auth.currentUser || auth.currentUser.email !== 'benczech212@gmail.com') return [];
  const q = collection(db, 'savedConfigs');
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as SavedConfig);
};

export const deleteConfiguration = async (id: string) => {
  if (!auth.currentUser) throw new Error("Must be logged in");
  await deleteDoc(doc(db, 'savedConfigs', id));
};
