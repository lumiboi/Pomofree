// Kolektif kedi ve azim sistemi (plan §4, §5, §6, §9, §14).
// Buradaki her şey saf fonksiyon: Firestore'a yazılan değerler bu dosyadan çıkar.
import { cleanSocialText, maskDisplayName } from './socialModel';

export const EFFORT_CONTRIBUTION = {
  focus_started: 1,
  focus_completed: 2,
  focus_retried: 3,
  focus_stopped: 1,
  rest_chosen: 1,
  reflection_written: 2,
  support_given: 1,
  returned_after_break: 4,
  weekly_review: 3
};

export const DAILY_CONTRIBUTION_CAP = 12;

// Aynı eylemin art arda spam'lenmesini engelleyen bekleme süreleri.
const THROTTLE_MINUTES = {
  focus_started: 5,
  focus_completed: 5,
  focus_retried: 10,
  focus_stopped: 10,
  rest_chosen: 30,
  reflection_written: 10,
  support_given: 1,
  returned_after_break: 24 * 60,
  weekly_review: 7 * 24 * 60
};

const DEFAULT_THROTTLE_MINUTES = 5;

export const CAPACITY_LEVELS = ['very_low', 'low', 'medium', 'good'];

// Kapasite düşükse hedef küçülür; bu bir ceza değil, gerçekçi planlama (plan §9.1).
const CAPACITY_SUGGESTIONS = {
  very_low: { minutes: 10, sessions: 1 },
  low: { minutes: 15, sessions: 1 },
  medium: { minutes: 25, sessions: 2 },
  good: { minutes: 25, sessions: 3 }
};

export const FLEXIBLE_DURATIONS = [10, 15, 25, 40];

export const CAT_MOODS = ['calm', 'curious', 'playful', 'sleepy', 'happy', 'resting'];

// Aşama eşikleri kümülatif kolektif katkıdır; kedi asla geri gitmez (plan §4.2).
export const CAT_STAGES = [
  { stage: 1, key: 'kitten', threshold: 0 },
  { stage: 2, key: 'bowl', threshold: 150 },
  { stage: 3, key: 'cushion', threshold: 400 },
  { stage: 4, key: 'mouse', threshold: 900 },
  { stage: 5, key: 'window', threshold: 1800 },
  { stage: 6, key: 'shelf', threshold: 3200 },
  { stage: 7, key: 'plants', threshold: 5200 },
  { stage: 8, key: 'playground', threshold: 8000 },
  { stage: 9, key: 'wall', threshold: 12000 },
  { stage: 10, key: 'room', threshold: 17000 }
];

const toDate = value => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (value && typeof value.toDate === 'function') return value.toDate();
  // new Date(null) epoch'a düşer; boş değerleri tarih saymıyoruz.
  if (value === null || value === undefined || value === '') return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const toDayKey = (value = new Date()) => {
  const date = toDate(value) || new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

/**
 * Haftanın anahtarı, o haftanın pazartesi tarihidir; gün anahtarıyla aynı
 * biçimde durur ki karşılaştırması ucuz olsun.
 */
export const toWeekKey = (value = new Date()) => {
  const date = toDate(value) || new Date();
  const monday = new Date(date);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return toDayKey(monday);
};

export const isEffortType = type => Object.hasOwn(EFFORT_CONTRIBUTION, type);

export const getContribution = type => EFFORT_CONTRIBUTION[type] || 0;

/**
 * Bir eylemin kolektif kediye ne kadar katkı yazacağını hesaplar.
 * Günlük tavan ve spam koruması burada uygulanır (plan §14).
 */
export const getThrottleMinutes = type => THROTTLE_MINUTES[type] || DEFAULT_THROTTLE_MINUTES;

export const getEffortAward = (type, recentEvents = [], now = new Date()) => {
  const base = getContribution(type);
  if (!base) return { value: 0, reason: 'unknown' };

  const moment = toDate(now) || new Date();
  const today = toDayKey(moment);
  const sameDay = recentEvents.filter(event => toDayKey(event.createdAt) === today);

  // Tavan günlük, bekleme süresi ise haftalık öz değerlendirme gibi
  // olaylarda günü aşabilir; bu yüzden tüm geçmişe bakıyoruz.
  const throttleMs = getThrottleMinutes(type) * 60 * 1000;
  const lastOfType = recentEvents
    .filter(event => event.type === type)
    .map(event => toDate(event.createdAt))
    .filter(Boolean)
    .sort((a, b) => b - a)[0];

  if (lastOfType && moment.getTime() - lastOfType.getTime() < throttleMs) {
    return { value: 0, reason: 'throttled' };
  }

  const used = sameDay.reduce((total, event) => total + (Number(event.contributionValue) || 0), 0);
  const remaining = Math.max(0, DAILY_CONTRIBUTION_CAP - used);
  if (remaining === 0) return { value: 0, reason: 'daily-cap' };

  return { value: Math.min(base, remaining), reason: 'counted' };
};

export const createEffortEvent = (type, value, extra = {}, now = new Date()) => ({
  type,
  contributionValue: Math.max(0, Math.round(Number(value) || 0)),
  relatedSessionId: extra.relatedSessionId || null,
  relatedPostId: extra.relatedPostId || null,
  createdAt: toDate(now) || new Date()
});

export const getCatStage = (totalContribution = 0) => {
  const total = Math.max(0, Number(totalContribution) || 0);
  const current = [...CAT_STAGES].reverse().find(item => total >= item.threshold) || CAT_STAGES[0];
  const next = CAT_STAGES.find(item => item.stage === current.stage + 1) || null;
  const span = next ? next.threshold - current.threshold : 0;
  const progress = next ? Math.min(1, (total - current.threshold) / span) : 1;

  return {
    stage: current.stage,
    key: current.key,
    nextKey: next?.key || null,
    nextThreshold: next?.threshold || null,
    progress: Number.isFinite(progress) ? progress : 0,
    isComplete: !next
  };
};

/**
 * Kedinin hâli; "üzgün", "aç" veya "hasta" gibi suçluluk üreten durumlar yok (plan §4.4).
 * Topluluk sessizse kedi en fazla sakinleşir.
 */
export const getCatMood = ({
  recentContribution = 0,
  communityContribution = 0,
  hour = new Date().getHours(),
  userRested = false
} = {}) => {
  if (userRested) return 'resting';
  // Kendi katkın kadar topluluğun günü de kedinin hâlini belirler.
  const energy = recentContribution + Math.min(6, Math.floor(communityContribution / 25));
  if (energy >= 6) return 'happy';
  if (energy >= 3) return 'playful';
  if (energy >= 1) return 'curious';
  if (hour >= 23 || hour < 6) return 'sleepy';
  return 'calm';
};

/**
 * Kedi odasında açılan eşyalar: aşama geçildikçe birikir, hiç geri alınmaz.
 */
export const getUnlockedItems = (totalContribution = 0) => {
  const { stage } = getCatStage(totalContribution);
  return CAT_STAGES.filter(item => item.stage <= stage).map(item => item.key);
};

/**
 * Dönemsel büyüme (plan §4.3): sezon anahtarı takvim ayıdır.
 */
export const getSeasonId = (now = new Date()) => {
  const date = toDate(now) || new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Katkı listesinde görünecek ad. Profili herkese açık olmayan kullanıcının
 * tam adı hiç yazılmaz; maskesi kaydedilir, böylece belgeyi okuyan da göremez.
 */
export const contributorName = (displayName, publicProfile) => {
  const clean = cleanSocialText(displayName, 50) || 'Pomofree kullanıcısı';
  return publicProfile ? clean : maskDisplayName(clean);
};

/**
 * Haftalık öz değerlendirme haftada bir kez katkı üretir (plan §6).
 */
export const isWeeklyReviewDue = (lastReviewAt, now = new Date()) => {
  const last = toDate(lastReviewAt);
  if (!last) return true;
  const moment = toDate(now) || new Date();
  return (moment.getTime() - last.getTime()) / (24 * 60 * 60 * 1000) >= 7;
};

export const getSuggestedFocus = capacity =>
  CAPACITY_SUGGESTIONS[capacity] || CAPACITY_SUGGESTIONS.medium;

export const createCheckIn = (capacity, now = new Date()) => ({
  capacity: CAPACITY_LEVELS.includes(capacity) ? capacity : 'medium',
  date: toDayKey(now),
  restChosen: false,
  createdAt: toDate(now) || new Date()
});

/**
 * Kullanıcı birkaç gün sonra döndüyse "geri dönüş azmi" katkısı doğar (plan §5.1).
 */
export const isReturnAfterBreak = (lastActiveAt, now = new Date(), minDays = 2) => {
  const last = toDate(lastActiveAt);
  if (!last) return false;
  const moment = toDate(now) || new Date();
  const days = (moment.getTime() - last.getTime()) / (24 * 60 * 60 * 1000);
  return days >= minDays;
};
