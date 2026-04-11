// client.ts — vanilla-TS island for the Astro portfolio browser.
// No framework runtime. Imports only the shared pure helpers (filter/data/types/i18n).

import { loadPortfolioData } from './data';
import { filterAndSort, type FilterState, type SortKey } from './filter';
import { MESSAGES, detectDefaultLang } from './i18n';
import type { Lang, PortfolioData, Entry, Category, Stack, Stage } from './types';

// ---- State ------------------------------------------------------------------

let _data: PortfolioData | null = null;
let _lang: Lang = readLangFromQuery() ?? detectDefaultLang();
let _filter: FilterState = readFilterFromQuery();

// ---- Boot -------------------------------------------------------------------

async function boot() {
  const app = document.getElementById('app')!;
  renderLoading(app);

  try {
    _data = await loadPortfolioData();
    render(app);
    wireEvents(app);
  } catch (err) {
    renderError(app, String(err));
  }
}

// ---- Render helpers ---------------------------------------------------------

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  for (const c of children) {
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
}

function a(href: string, cls: string, text: string, external = true): HTMLAnchorElement {
  const attrs: Record<string, string> = { href, class: cls };
  if (external) { attrs.target = '_blank'; attrs.rel = 'noopener'; }
  return el('a', attrs, text);
}

function renderLoading(root: HTMLElement) {
  const m = MESSAGES[_lang];
  root.innerHTML = '';
  root.appendChild(el('div', { class: 'state' }, m.loadingLabel));
}

function renderError(root: HTMLElement, msg: string) {
  const m = MESSAGES[_lang];
  root.innerHTML = '';
  root.appendChild(el('div', { class: 'state state-error' }, `${m.errorLabel}: ${msg}`));
}

function render(root: HTMLElement) {
  if (!_data) return;
  const d = _data;
  const m = MESSAGES[_lang];

  const stackMap = new Map<string, Stack>(d.stacks.map((s) => [s.id, s]));
  const stageMap = new Map<string, Stage>(d.stages.map((s) => [s.id, s]));
  const catMap = new Map<string, Category>(d.categories.map((c) => [c.id, c]));

  const visible = filterAndSort(d.entries, _filter, _lang);

  root.innerHTML = '';

  // ---- Header ----
  const headerTop = el('div', { class: 'header-top' },
    a('/', 'home-link', m.homeLabel, false),
    el('div', { class: 'lang-switch' },
      el('label', {}, m.langLabel),
      buildSelect('lang-select', [
        { value: 'ja', label: 'JA' },
        { value: 'en', label: 'EN' },
      ], _lang),
    ),
  );

  const header = el('header', { class: 'site-header' },
    headerTop,
    el('h1', {}, m.title),
    el('p', { class: 'subtitle' }, m.subtitle),
    el('p', { class: 'meta' },
      `${m.totalCount(d.entries.length)}\u3000\xB7\u3000${m.lastUpdated(d.updatedAt)}\u3000\xB7 ${m.framework}`,
    ),
  );

  // ---- Controls ----
  const searchInput = el('input', {
    type: 'text',
    class: 'search',
    placeholder: m.searchPlaceholder,
    value: _filter.query,
  });

  const catSelect = el('label', { class: 'select-wrap' },
    el('span', { class: 'select-label' }, m.categoryLabel),
    buildSelect('cat-select',
      [{ value: 'all', label: m.allLabel }, ...d.categories.map((c) => ({ value: c.id, label: c.name[_lang] }))],
      _filter.category,
    ),
  );

  const stackSelect = el('label', { class: 'select-wrap' },
    el('span', { class: 'select-label' }, m.stackLabel),
    buildSelect('stack-select',
      [{ value: 'all', label: m.allLabel }, ...d.stacks.map((s) => ({ value: s.id, label: s.name }))],
      _filter.stack,
    ),
  );

  const stageSelect = el('label', { class: 'select-wrap' },
    el('span', { class: 'select-label' }, m.stageLabel),
    buildSelect('stage-select',
      [{ value: 'all', label: m.allLabel }, ...d.stages.map((s) => ({ value: s.id, label: `${s.icon} ${s.name[_lang]}` }))],
      _filter.stage,
    ),
  );

  const sortSelect = el('label', { class: 'select-wrap' },
    el('span', { class: 'select-label' }, m.sortLabel),
    buildSelect('sort-select', [
      { value: 'number', label: m.sortNumber },
      { value: 'newest', label: m.sortNewest },
      { value: 'oldest', label: m.sortOldest },
      { value: 'name', label: m.sortName },
    ], _filter.sort),
  );

  const filters = el('div', { class: 'filters' }, catSelect, stackSelect, stageSelect, sortSelect);
  const resultCount = el('div', { class: 'result-count' }, m.filteredCount(visible.length, d.entries.length));
  const controls = el('section', { class: 'controls' }, searchInput, filters, resultCount);

  // ---- Grid ----
  let gridOrEmpty: HTMLElement;
  if (visible.length === 0) {
    gridOrEmpty = el('p', { class: 'empty' }, m.noResults);
  } else {
    const grid = el('section', { class: 'grid' });
    for (const entry of visible) {
      grid.appendChild(buildCard(entry, stackMap, stageMap, catMap));
    }
    gridOrEmpty = grid;
  }

  const main = el('main', {}, controls, gridOrEmpty);

  const footer = el('footer', { class: 'site-footer' },
    `SEN 合同会社 \xB7 Astro (islands architecture + vanilla TS) \xB7 entry 028`,
  );

  root.appendChild(header);
  root.appendChild(main);
  root.appendChild(footer);

  // Re-wire after fresh render
  wireEvents(root);
}

function buildSelect(id: string, options: { value: string; label: string }[], selected: string): HTMLSelectElement {
  const sel = el('select', { id });
  for (const opt of options) {
    const o = el('option', { value: opt.value }, opt.label);
    if (opt.value === selected) o.selected = true;
    sel.appendChild(o);
  }
  return sel;
}

function buildCard(
  entry: Entry,
  stackMap: Map<string, Stack>,
  stageMap: Map<string, Stage>,
  catMap: Map<string, Category>,
): HTMLElement {
  const m = MESSAGES[_lang];
  const stage = stageMap.get(entry.stage);
  const cat = catMap.get(entry.category);

  const cardHead = el('div', { class: 'card-head' },
    el('span', { class: 'entry-number' }, `#${String(entry.number).padStart(3, '0')}`),
  );
  if (stage) {
    cardHead.appendChild(el('span', { class: 'stage-badge' }, `${stage.icon} ${stage.name[_lang]}`));
  }

  const techRow = el('div', { class: 'tech-row' });
  for (const techId of entry.tech) {
    const s = stackMap.get(techId);
    const chip = el('span', { class: 'tech-chip', style: `border-left-color:${s?.color ?? '#272b35'}` },
      s?.name ?? techId,
    );
    techRow.appendChild(chip);
  }

  const actions = el('div', { class: 'actions' });
  if (entry.demo) actions.appendChild(a(entry.demo, 'action-btn primary', `\u2197 ${m.demoLabel}`));
  if (entry.github) actions.appendChild(a(entry.github, 'action-btn', m.githubLabel));
  if (entry.articles.length > 0) {
    const arts = el('div', { class: 'articles' });
    for (const art of entry.articles) {
      arts.appendChild(a(art.url, 'article-link', art.platform));
    }
    actions.appendChild(arts);
  }
  if (entry.testCount && entry.testCount > 0) {
    actions.appendChild(el('span', { class: 'tests-badge' }, m.testsLabel(entry.testCount)));
  }

  const card = el('article', { class: 'card' },
    cardHead,
    el('h2', { class: 'entry-name' }, entry.name[_lang]),
  );
  if (cat) card.appendChild(el('div', { class: 'category' }, cat.name[_lang]));
  card.appendChild(el('p', { class: 'pitch' }, entry.pitch[_lang]));
  card.appendChild(techRow);
  card.appendChild(actions);
  return card;
}

// ---- Event wiring -----------------------------------------------------------

function wireEvents(root: HTMLElement) {
  const search = root.querySelector<HTMLInputElement>('.search');
  const langSel = root.querySelector<HTMLSelectElement>('#lang-select');
  const catSel = root.querySelector<HTMLSelectElement>('#cat-select');
  const stackSel = root.querySelector<HTMLSelectElement>('#stack-select');
  const stageSel = root.querySelector<HTMLSelectElement>('#stage-select');
  const sortSel = root.querySelector<HTMLSelectElement>('#sort-select');

  search?.addEventListener('input', (e) => {
    _filter = { ..._filter, query: (e.target as HTMLInputElement).value };
    writeQuery();
    render(root);
  });
  langSel?.addEventListener('change', (e) => {
    _lang = (e.target as HTMLSelectElement).value as Lang;
    writeQuery();
    render(root);
  });
  catSel?.addEventListener('change', (e) => {
    _filter = { ..._filter, category: (e.target as HTMLSelectElement).value };
    writeQuery();
    render(root);
  });
  stackSel?.addEventListener('change', (e) => {
    _filter = { ..._filter, stack: (e.target as HTMLSelectElement).value };
    writeQuery();
    render(root);
  });
  stageSel?.addEventListener('change', (e) => {
    _filter = { ..._filter, stage: (e.target as HTMLSelectElement).value };
    writeQuery();
    render(root);
  });
  sortSel?.addEventListener('change', (e) => {
    _filter = { ..._filter, sort: (e.target as HTMLSelectElement).value as SortKey };
    writeQuery();
    render(root);
  });
}

// ---- URL query sync ---------------------------------------------------------

function readLangFromQuery(): Lang | null {
  if (typeof window === 'undefined') return null;
  const q = new URLSearchParams(window.location.search);
  const v = q.get('lang');
  return v === 'ja' || v === 'en' ? v : null;
}

function readFilterFromQuery(): FilterState {
  if (typeof window === 'undefined') return defaultFilter();
  const q = new URLSearchParams(window.location.search);
  return {
    query: q.get('q') ?? '',
    category: q.get('category') ?? 'all',
    stack: q.get('stack') ?? 'all',
    stage: q.get('stage') ?? 'all',
    sort: (q.get('sort') as SortKey) ?? 'number',
  };
}

function writeQuery() {
  if (typeof window === 'undefined') return;
  const q = new URLSearchParams();
  if (_filter.query) q.set('q', _filter.query);
  if (_filter.category !== 'all') q.set('category', _filter.category);
  if (_filter.stack !== 'all') q.set('stack', _filter.stack);
  if (_filter.stage !== 'all') q.set('stage', _filter.stage);
  if (_filter.sort !== 'number') q.set('sort', _filter.sort);
  q.set('lang', _lang);
  const qs = q.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.replaceState(null, '', url);
}

function defaultFilter(): FilterState {
  return { query: '', category: 'all', stack: 'all', stage: 'all', sort: 'number' };
}

// ---- Start ------------------------------------------------------------------

boot();
