// İç döküm yazma/silme akışı. Anonim gönderilerde yazar kimliği belgeye
// yazılmadığı için sahiplik kullanıcının kendi özel kaydından doğrulanır.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { buildReflection } from './reflectionModel';

export const publishReflection = async (user, input) => {
  const reflection = buildReflection({ ...input, authorId: user.uid, displayName: user.displayName });

  if (reflection.visibility === 'private') {
    const created = await addDoc(collection(db, 'users', user.uid, 'journal'), {
      ...reflection,
      authorId: user.uid,
      createdAt: serverTimestamp()
    });
    return { id: created.id, visibility: 'private' };
  }

  // Kimliği açık etmemek için önce id üretip aynı id ile özel sahiplik kaydı yazıyoruz.
  const reference = doc(collection(db, 'reflections'));
  await setDoc(reference, {
    ...reflection,
    supportCount: 0,
    createdAt: serverTimestamp()
  });
  await setDoc(doc(db, 'users', user.uid, 'myReflections', reference.id), {
    visibility: reflection.visibility,
    createdAt: serverTimestamp()
  });

  return { id: reference.id, visibility: reflection.visibility };
};

export const readOwnedReflectionIds = async uid => {
  const snapshot = await getDocs(query(collection(db, 'users', uid, 'myReflections'), limit(200)));
  return snapshot.docs.map(item => item.id);
};

export const deleteReflection = async (uid, reflectionId, { fromJournal = false } = {}) => {
  if (fromJournal) {
    await deleteDoc(doc(db, 'users', uid, 'journal', reflectionId));
    return;
  }
  await deleteDoc(doc(db, 'reflections', reflectionId));
  await deleteDoc(doc(db, 'users', uid, 'myReflections', reflectionId)).catch(() => {});
};
