import fs from 'fs';
import path from 'path';
import { translations } from './index';
import { CAPACITY_LEVELS, CAT_MOODS, CAT_STAGES } from '../effortModel';
import {
  FEED_TABS,
  MODERATION_STATUSES,
  REFLECTION_KINDS,
  REFLECTION_PROMPTS,
  REFLECTION_VISIBILITIES,
  REPORT_REASONS,
  SUPPORT_TYPES
} from '../reflectionModel';

const { tr, en } = translations;

const sourceFiles = (dir, found = []) => {
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, found);
    else if (/\.jsx?$/.test(entry.name) && !entry.name.includes('.test.')) found.push(full);
  });
  return found;
};

const expectKeys = keys => {
  const missing = keys.filter(key => !tr[key] || !en[key]);
  expect(missing).toEqual([]);
};

it('has the same keys in both languages', () => {
  expect(Object.keys(tr).filter(key => !(key in en))).toEqual([]);
  expect(Object.keys(en).filter(key => !(key in tr))).toEqual([]);
});

it('translates every literal t() call in the source', () => {
  const used = new Set();
  sourceFiles(path.join(__dirname, '..')).forEach(file => {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'/g)) used.add(match[1]);
  });

  expect(used.size).toBeGreaterThan(50);
  expectKeys([...used]);
});

// Şablon dizgisiyle kurulan anahtarlar yukarıdaki taramaya takılmaz;
// bu yüzden model sabitlerinden türetip tek tek doğruluyoruz.
it('translates every key built from a model constant', () => {
  expectKeys([
    ...CAT_MOODS.map(mood => `cat.mood.${mood}`),
    ...CAT_STAGES.map(stage => `cat.stage.${stage.key}`),
    ...CAPACITY_LEVELS.map(level => `checkIn.capacity.${level}`),
    ...REFLECTION_PROMPTS.map(prompt => `reflections.prompt.${prompt}`),
    ...REFLECTION_KINDS.map(kind => `reflections.kind.${kind}`),
    ...REFLECTION_VISIBILITIES.flatMap(visibility => [
      `reflections.visibility.${visibility}`,
      `reflections.visibilityHint.${visibility}`,
      `reflections.submit.${visibility}`
    ]),
    ...[...FEED_TABS, 'journal', 'feed'].map(tab => `reflections.tab.${tab}`),
    ...SUPPORT_TYPES.map(type => `reflections.support.${type}`),
    ...REPORT_REASONS.map(reason => `reflections.reason.${reason}`),
    ...MODERATION_STATUSES.map(status => `moderation.status.${status}`),
    ...['quiet', 'restingTogether', 'smallSteps', 'sittingNearby']
      .map(message => `reflections.catMessage.${message}`),
    ...['feed', 'journal'].map(tab => `reflections.empty.${tab}`)
  ]);
});
