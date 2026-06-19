import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc,
  deleteDoc, query, where, orderBy, limit, serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'

// ── Generic helpers ──
export const getDocument = (col, id) => getDoc(doc(db, col, id))
export const getCollection = (col) => getDocs(collection(db, col))
export const addDocument = (col, data) => addDoc(collection(db, col), { ...data, createdAt: serverTimestamp() })
export const updateDocument = (col, id, data) => updateDoc(doc(db, col, id), { ...data, updatedAt: serverTimestamp() })
export const deleteDocument = (col, id) => deleteDoc(doc(db, col, id))
export const queryCollection = (col, ...constraints) => getDocs(query(collection(db, col), ...constraints))

// Re-export query helpers
export { where, orderBy, limit, serverTimestamp }
