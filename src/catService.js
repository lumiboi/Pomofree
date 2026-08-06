// Kolektif kedinin Firestore tarafı. Kural: kedi yalnızca ileri gider.
import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { createEffortEvent, getEffortAward, toDayKey } from './effortModel';

export const COLLECTIVE_CAT_PATH = ['collectiveCat', 'current'];

export const subscribeCollectiveCat = (onChange, onError) => onSnapshot(
  doc(db, ...COLLECTIVE_CAT_PATH),
  snapshot => onChange({
    totalContribution: snapshot.exists() ? Number(snapshot.data().totalContribution) || 0 : 0,
    updatedAt: snapshot.exists() ? snapshot.data().updatedAt : null
  }),
  onError
);

const startOfToday = (now = new Date()) => {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start;
};

const readTodayEvents = async (uid, now) => {
  const snapshot = await getDocs(query(
    collection(db, 'users', uid, 'effortEvents'),
    where('createdAt', '>=', startOfToday(now)),
    limit(100)
  ));
  return snapshot.docs.map(item => item.data());
};

/**
 * Bir azim eylemini kaydeder ve hak edilen katkıyı kolektif kediye ekler.
 * Tavan dolduğunda veya spam korumasına takıldığında olay yine yazılır ama
 * katkı 0 olur; kullanıcının geçmişi silinmez (plan §14).
 */
export const recordEffort = async (user, type, extra = {}, now = new Date()) => {
  if (!user?.uid) return { value: 0, reason: 'anonymous' };

  const todayEvents = await readTodayEvents(user.uid, now);
  const award = getEffortAward(type, todayEvents, now);
  const event = createEffortEvent(type, award.value, extra, now);

  await addDoc(collection(db, 'users', user.uid, 'effortEvents'), {
    ...event,
    userId: user.uid,
    dayKey: toDayKey(now)
  });

  if (award.value > 0) {
    await setDoc(doc(db, ...COLLECTIVE_CAT_PATH), {
      totalContribution: increment(award.value),
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  return award;
};

export const readTodayContribution = async (uid, now = new Date()) => {
  if (!uid) return 0;
  const events = await readTodayEvents(uid, now);
  return events.reduce((total, item) => total + (Number(item.contributionValue) || 0), 0);
};

export const saveCheckIn = (uid, checkIn) => setDoc(
  doc(db, 'users', uid, 'checkIns', checkIn.date),
  checkIn,
  { merge: true }
);
