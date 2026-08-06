// İç dökme sistemi (plan §7, §8). Varsayılan görünürlük her zaman "private".

export const REFLECTION_VISIBILITIES = ['private', 'anonymous', 'public'];
export const DEFAULT_VISIBILITY = 'private';
export const REFLECTION_MAX_LENGTH = 1000;

// Akış sekmeleri popülerlik değil, içerik türü üzerinden ayrılır (plan §10).
export const REFLECTION_KINDS = ['reflection', 'progress', 'rest'];
export const DEFAULT_KIND = 'reflection';
export const FEED_TABS = ['today', 'reflection', 'progress', 'rest', 'mine'];
export const MODERATION_STATUSES = ['published', 'limited', 'removed'];

export const SUPPORT_TYPES = [
  'with_you',
  'read',
  'not_alone',
  'hug',
  'rest_is_okay',
  'try_again'
];

export const REPORT_REASONS = [
  'harassment',
  'hate',
  'personal_info',
  'harmful_advice',
  'spam',
  'sensitive',
  'other'
];

export const REFLECTION_PROMPTS = [
  'todayHard',
  'onMyMind',
  'couldNotDo',
  'smallThing',
  'tomorrowNote',
  'needRightNow'
];

// Yayın öncesi mahremiyet uyarısını tetikleyen kalıplar (plan §8.3).
const PERSONAL_INFO_PATTERNS = [
  /\b[\w.%+-]+@[\w.-]+\.[a-z]{2,}\b/i,
  /(?:\+\d{1,3}[\s-]?)?(?:0[\s-]?)?\d{3}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}/,
  /\b(?:instagram|twitter|tiktok|discord|telegram|whatsapp)\b/i,
  /https?:\/\/\S+/i
];

// Hassas içerik işaretleme; ceza değil, uyarı ve kaynak göstermek için (plan §8.2).
const SENSITIVE_PATTERNS = [
  /intihar|kendime zarar|yaşamak istemiyorum|ölmek istiyorum/i,
  /suicide|self.?harm|kill myself|want to die/i,
  /taciz|istismar|şiddet/i,
  /abuse|assault|violence/i,
  /yeme bozuk|kusma krizi|aç kalma cezas/i,
  /eating disorder|purging/i
];

const clean = (value, limit) => String(value ?? '').trim().slice(0, limit);

export const normalizeVisibility = value =>
  REFLECTION_VISIBILITIES.includes(value) ? value : DEFAULT_VISIBILITY;

export const containsPersonalInfo = body =>
  PERSONAL_INFO_PATTERNS.some(pattern => pattern.test(String(body || '')));

export const looksSensitive = body =>
  SENSITIVE_PATTERNS.some(pattern => pattern.test(String(body || '')));

/**
 * Anonim paylaşımda yazarın adı hiçbir zaman belgeye yazılmaz; sonradan
 * anonimliğin bozulması mümkün olmasın diye ad alanı boş kalır (plan §19).
 */
export const buildReflection = (input, now = new Date()) => {
  const visibility = normalizeVisibility(input.visibility);
  const body = clean(input.body, REFLECTION_MAX_LENGTH);

  return {
    // Anonim paylaşımda yazar kimliği belgeye hiç yazılmaz; sahiplik
    // kullanıcının kendi özel kaydında tutulur, böylece akışı okuyan
    // kimse gönderiyi bir hesaba bağlayamaz (plan §7.2, §19).
    authorId: visibility === 'anonymous' ? '' : clean(input.authorId, 128),
    displayName: visibility === 'public' ? clean(input.displayName, 50) || 'Pomofree' : '',
    body,
    kind: REFLECTION_KINDS.includes(input.kind) ? input.kind : DEFAULT_KIND,
    visibility,
    isSensitive: Boolean(input.isSensitive) || looksSensitive(body),
    moderationStatus: 'published',
    createdAt: now instanceof Date ? now : new Date()
  };
};

export const isPublishable = body => clean(body, REFLECTION_MAX_LENGTH).length > 0;

const toDate = value => value?.toDate?.() || (value ? new Date(value) : null);

export const matchesTab = (reflection, tab, { ownedIds = [], now = new Date() } = {}) => {
  if (!tab || tab === 'all') return true;
  if (tab === 'mine') return ownedIds.includes(reflection.id);
  if (tab === 'today') {
    const created = toDate(reflection.createdAt);
    if (!created || Number.isNaN(created.getTime())) return false;
    return created.toDateString() === now.toDateString();
  }
  return (reflection.kind || DEFAULT_KIND) === tab;
};

/**
 * Kedi akışa bakıp kısa bir cümle söyler; teşhis veya psikolojik yorum değil (plan §11).
 */
export const getCatFeedMessage = (reflections = []) => {
  const visible = reflections.filter(Boolean);
  if (visible.length === 0) return 'quiet';
  const rest = visible.filter(item => item.kind === 'rest').length;
  const progress = visible.filter(item => item.kind === 'progress').length;
  if (rest > progress && rest >= 2) return 'restingTogether';
  if (progress >= 2) return 'smallSteps';
  return 'sittingNearby';
};

export const authorLabel = (reflection, anonymousLabel) =>
  reflection?.visibility === 'public' && reflection.displayName
    ? reflection.displayName
    : anonymousLabel;

/**
 * Akış popülerliğe göre değil; yeni ve az destek almış gönderiler öne gelir (plan §10).
 */
export const orderReflections = (reflections = [], {
  hiddenIds = [],
  hiddenAuthorIds = [],
  tab = null,
  ownedIds = [],
  now = new Date()
} = {}) =>
  reflections
    .filter(item => item && !hiddenIds.includes(item.id) && !hiddenAuthorIds.includes(item.authorId))
    // Moderasyonda kaldırılan içerik akışta görünmez (plan §8).
    .filter(item => item.moderationStatus !== 'removed')
    .filter(item => matchesTab(item, tab, { ownedIds, now }))
    .slice()
    .sort((a, b) => {
      const supportDiff = (a.supportCount || 0) - (b.supportCount || 0);
      if (supportDiff !== 0) return supportDiff;
      const first = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
      const second = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
      return second - first;
    });
