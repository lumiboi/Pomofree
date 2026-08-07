// Kolektif kedinin Firestore tarafı. Kural: kedi yalnızca ileri gider.
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';
import { db } from './firebase';
import {
  contributorName,
  createEffortEvent,
  getEffortAward,
  getSeasonId,
  getThrottleMinutes,
  toDayKey,
  toWeekKey
} from './effortModel';

export const CONTRIBUTORS_LIMIT = 40;

/**
 * Katkı verenler herkese açık okunur; kimse kimseyi sıralamaz, yalnızca
 * "kim dokundu" görünür (plan §10: sıralama yok).
 */
export const subscribeContributors = (onChange, onError) => onSnapshot(
  query(
    collection(db, 'catContributors'),
    orderBy('lastContributionAt', 'desc'),
    limit(CONTRIBUTORS_LIMIT)
  ),
  snapshot => onChange(snapshot.docs.map(item => ({ id: item.id, ...item.data() }))),
  onError
);

export const COLLECTIVE_CAT_PATH = ['collectiveCat', 'current'];

const readCat = snapshot => {
  const data = snapshot.exists() ? snapshot.data() : {};
  const today = toDayKey();
  const week = toWeekKey();
  const season = getSeasonId();
  // Dönem değişince o dönemin sayacı sıfırdan sayılır; toplam hiç sıfırlanmaz.
  const daily = data.dayKey === today ? Number(data.dailyContribution) || 0 : 0;
  // Hafta bugünü, dönem de haftayı kapsar: sayaçlar bu tabanın altına düşemez.
  // Yeni sayaçlar eklenmeden önceki kayıtlar da böylece tutarlı görünür.
  const weekly = Math.max(data.weekKey === week ? Number(data.weeklyContribution) || 0 : 0, daily);
  const seasonal = Math.max(data.seasonId === season ? Number(data.seasonContribution) || 0 : 0, weekly);

  return {
    totalContribution: Number(data.totalContribution) || 0,
    dailyContribution: daily,
    weeklyContribution: weekly,
    seasonContribution: seasonal,
    dayKey: data.dayKey || today,
    weekKey: data.weekKey || week,
    seasonId: data.seasonId || season,
    updatedAt: data.updatedAt || null
  };
};

export const subscribeCollectiveCat = (onChange, onError) => onSnapshot(
  doc(db, ...COLLECTIVE_CAT_PATH),
  snapshot => onChange(readCat(snapshot)),
  onError
);

export const fetchCollectiveCat = async () => readCat(await getDoc(doc(db, ...COLLECTIVE_CAT_PATH)));

const startOfDaysAgo = (days, now = new Date()) => {
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  return start;
};

/**
 * Günlük tavan için bugünün olayları yeter; haftalık öz değerlendirme gibi
 * uzun bekleme süreli olaylarda daha geriye bakmak gerekir.
 */
const readRecentEvents = async (uid, type, now) => {
  const days = Math.max(0, Math.ceil(getThrottleMinutes(type) / (24 * 60)) - 1);
  const snapshot = await getDocs(query(
    collection(db, 'users', uid, 'effortEvents'),
    where('createdAt', '>=', startOfDaysAgo(days, now)),
    limit(300)
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
  // Oyunlaştırmayı kapatan kullanıcı için hiçbir katkı üretilmez (plan §19).
  if (extra.gamificationEnabled === false) return { value: 0, reason: 'opted-out' };

  const recentEvents = await readRecentEvents(user.uid, type, now);
  const award = getEffortAward(type, recentEvents, now);
  const event = createEffortEvent(type, award.value, extra, now);

  await addDoc(collection(db, 'users', user.uid, 'effortEvents'), {
    ...event,
    userId: user.uid,
    dayKey: toDayKey(now)
  });

  if (award.value > 0) {
    const today = toDayKey(now);
    const week = toWeekKey(now);
    const season = getSeasonId(now);
    const cat = await fetchCollectiveCat();
    // Gün, hafta ve dönem sayaçları kendi anahtarları değişince sıfırdan başlar;
    // toplam katkı hiçbir zaman sıfırlanmaz.
    await setDoc(doc(db, ...COLLECTIVE_CAT_PATH), {
      totalContribution: increment(award.value),
      dailyContribution: cat.dayKey === today ? increment(award.value) : award.value,
      weeklyContribution: cat.weekKey === week ? increment(award.value) : award.value,
      seasonContribution: cat.seasonId === season ? increment(award.value) : award.value,
      dayKey: today,
      weekKey: week,
      seasonId: season,
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Odadaki "kim dokundu" listesi. Profili gizli olanın adı maskeli yazılır.
    await setDoc(doc(db, 'catContributors', user.uid), {
      userId: user.uid,
      displayName: contributorName(extra.displayName || user.displayName, extra.publicProfile === true),
      publicProfile: extra.publicProfile === true,
      totalContribution: increment(award.value),
      lastContributionAt: serverTimestamp()
    }, { merge: true }).catch(error => console.error('Katkı listesi güncellenemedi:', error));
  }

  return award;
};

export const readTodayContribution = async (uid, now = new Date()) => {
  if (!uid) return 0;
  const snapshot = await getDocs(query(
    collection(db, 'users', uid, 'effortEvents'),
    where('createdAt', '>=', startOfDaysAgo(0, now)),
    limit(300)
  ));
  return snapshot.docs.reduce((total, item) => total + (Number(item.data().contributionValue) || 0), 0);
};

export const saveCheckIn = (uid, checkIn) => setDoc(
  doc(db, 'users', uid, 'checkIns', checkIn.date),
  checkIn,
  { merge: true }
);
