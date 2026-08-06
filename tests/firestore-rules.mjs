// Pomofree firestore.rules'u emülatörde gerçek isteklerle sınar.
//
// Çalıştırmak için (JDK 21 varsa firebase-tools@13 yerine güncel sürüm de olur):
//   npm i -D @firebase/rules-unit-testing --legacy-peer-deps
//   npx firebase-tools@13 emulators:exec --only firestore --project pomofree-rules-test //     "node tests/firestore-rules.mjs"
import fs from 'node:fs';
import path from 'node:path';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, addDoc, collection, increment, serverTimestamp } from 'firebase/firestore';

const RULES = path.resolve(process.cwd(), 'firestore.rules');

const results = [];
const check = async (name, promise) => {
  try {
    await promise;
    results.push(['OK  ', name]);
  } catch (error) {
    results.push(['FAIL', `${name} → ${error.message.split('\n')[0]}`]);
  }
};

const env = await initializeTestEnvironment({
  projectId: 'pomofree-rules-test',
  firestore: { rules: fs.readFileSync(RULES, 'utf8'), host: '127.0.0.1', port: 8080 }
});

await env.clearFirestore();

const alice = env.authenticatedContext('alice').firestore();
const bob = env.authenticatedContext('bob').firestore();
const carol = env.authenticatedContext('carol').firestore();
const guest = env.unauthenticatedContext().firestore();

// Moderatör kaydını yalnızca yönetici bağlamı yazabilir.
await env.withSecurityRulesDisabled(async admin => {
  await setDoc(doc(admin.firestore(), 'moderators', 'bob'), { since: 'test' });
});

const post = (extra = {}) => ({
  authorId: 'alice',
  displayName: 'Alice',
  body: 'bugün zordu',
  kind: 'reflection',
  visibility: 'public',
  isSensitive: false,
  moderationStatus: 'published',
  supportCount: 0,
  createdAt: new Date(),
  ...extra
});

// --- Kolektif kedi ---
await check('kedi belgesi giriş yapmadan okunabilir', assertSucceeds(getDoc(doc(guest, 'collectiveCat', 'current'))));
await check('kedi ilk katkıyla oluşturulur', assertSucceeds(setDoc(doc(alice, 'collectiveCat', 'current'), {
  totalContribution: 4, dailyContribution: 4, dayKey: '2026-08-06', seasonId: '2026-08', updatedAt: serverTimestamp()
})));
await check('kedi tavanı aşan tek yazımı reddeder', assertFails(setDoc(doc(alice, 'collectiveCat', 'current'), {
  totalContribution: increment(50), dailyContribution: increment(50), dayKey: '2026-08-06', seasonId: '2026-08', updatedAt: serverTimestamp()
}, { merge: true })));
await check('kedi geriye gidemez', assertFails(setDoc(doc(alice, 'collectiveCat', 'current'), {
  totalContribution: increment(-2), dailyContribution: 0, dayKey: '2026-08-06', seasonId: '2026-08', updatedAt: serverTimestamp()
}, { merge: true })));
await check('kedi normal katkıyı kabul eder', assertSucceeds(setDoc(doc(alice, 'collectiveCat', 'current'), {
  totalContribution: increment(3), dailyContribution: increment(3), dayKey: '2026-08-06', seasonId: '2026-08', updatedAt: serverTimestamp()
}, { merge: true })));
await check('giriş yapmayan kedi yazamaz', assertFails(setDoc(doc(guest, 'collectiveCat', 'current'), {
  totalContribution: increment(1), dailyContribution: increment(1), dayKey: '2026-08-06', seasonId: '2026-08', updatedAt: serverTimestamp()
}, { merge: true })));

// --- İç döküm ---
await check('açık gönderi yazarın kimliğiyle yazılır', assertSucceeds(setDoc(doc(alice, 'reflections', 'p1'), post())));
await check('anonim gönderide kimlik yazılamaz', assertFails(setDoc(doc(alice, 'reflections', 'p2'), post({ visibility: 'anonymous' }))));
await check('anonim gönderi kimliksiz kabul edilir', assertSucceeds(setDoc(doc(alice, 'reflections', 'p2'), post({ visibility: 'anonymous', authorId: '', displayName: '' }))));
await check('başkası adına gönderi atılamaz', assertFails(setDoc(doc(bob, 'reflections', 'p3'), post())));
await check('gönderi yayında olarak başlar', assertFails(setDoc(doc(alice, 'reflections', 'p4'), post({ moderationStatus: 'removed' }))));
await check('destek sayacı bir artırılabilir', assertSucceeds(updateDoc(doc(bob, 'reflections', 'p1'), { supportCount: increment(1) })));
await check('destek sayacı toptan artırılamaz', assertFails(updateDoc(doc(bob, 'reflections', 'p1'), { supportCount: increment(10) })));
await check('gönderi metni başkası tarafından değiştirilemez', assertFails(updateDoc(doc(bob, 'reflections', 'p1'), { body: 'değişti' })));
await check('destek kaydı sahibi tarafından yazılır', assertSucceeds(setDoc(doc(bob, 'reflections', 'p1', 'support', 'bob'), { userId: 'bob', type: 'hug', createdAt: new Date() })));
await check('başkasının adına destek yazılamaz', assertFails(setDoc(doc(bob, 'reflections', 'p1', 'support', 'alice'), { userId: 'alice', type: 'hug', createdAt: new Date() })));
await check('tanımsız destek türü reddedilir', assertFails(setDoc(doc(bob, 'reflections', 'p1', 'support', 'bob'), { userId: 'bob', type: 'clap', createdAt: new Date() })));

// Anonim gönderinin sahipliği özel kayıttan doğrulanır.
await check('anonim gönderinin sahiplik kaydı yazılır', assertSucceeds(setDoc(doc(alice, 'users', 'alice', 'myReflections', 'p2'), { visibility: 'anonymous', createdAt: new Date() })));
await check('yabancı anonim gönderiyi silemez', assertFails(deleteDoc(doc(carol, 'reflections', 'p2'))));
await check('sahibi anonim gönderisini silebilir', assertSucceeds(deleteDoc(doc(alice, 'reflections', 'p2'))));

// --- Raporlar ve moderasyon ---
await check('rapor yazılabilir', assertSucceeds(addDoc(collection(alice, 'reports'), {
  reflectionId: 'p1', reporterId: 'alice', reason: 'spam', createdAt: new Date()
})));
await check('başkası adına rapor yazılamaz', assertFails(addDoc(collection(alice, 'reports'), {
  reflectionId: 'p1', reporterId: 'bob', reason: 'spam', createdAt: new Date()
})));
await check('sıradan kullanıcı raporları okuyamaz', assertFails(getDoc(doc(alice, 'reports', 'any'))));
await check('moderatör raporları okuyabilir', assertSucceeds(getDoc(doc(bob, 'reports', 'any'))));
await check('moderatör görünürlüğü kısabilir', assertSucceeds(updateDoc(doc(bob, 'reflections', 'p1'), { moderationStatus: 'limited' })));
await check('yabancı başkasının gönderisini silemez', assertFails(deleteDoc(doc(carol, 'reflections', 'p1'))));
await check('sıradan kullanıcı moderasyon durumunu değiştiremez', assertFails(updateDoc(doc(alice, 'reflections', 'p1'), { moderationStatus: 'removed' })));
await check('moderatör gönderiyi silebilir', assertSucceeds(deleteDoc(doc(bob, 'reflections', 'p1'))));

// --- Kullanıcı verisi ---
await check('kullanıcı kendi azim olayını yazabilir', assertSucceeds(addDoc(collection(alice, 'users', 'alice', 'effortEvents'), {
  type: 'focus_started', contributionValue: 1, createdAt: new Date(), userId: 'alice', dayKey: '2026-08-06'
})));
await check('başkasının azim olayları okunamaz', assertFails(getDoc(doc(bob, 'users', 'alice', 'effortEvents', 'x'))));
await check('başkasının günlüğü okunamaz', assertFails(getDoc(doc(bob, 'users', 'alice', 'journal', 'x'))));
await check('kullanıcı kendi kapasite kaydını yazar', assertSucceeds(setDoc(doc(alice, 'users', 'alice', 'checkIns', '2026-08-06'), {
  capacity: 'low', date: '2026-08-06', restChosen: false, createdAt: new Date()
})));
await check('moderatör listesi istemciden yazılamaz', assertFails(setDoc(doc(alice, 'moderators', 'alice'), { since: 'hack' })));

await env.cleanup();

const failed = results.filter(([status]) => status === 'FAIL');
results.forEach(([status, name]) => console.log(`${status} ${name}`));
console.log(`\n${results.length - failed.length}/${results.length} kural testi geçti`);
process.exit(failed.length ? 1 : 0);
