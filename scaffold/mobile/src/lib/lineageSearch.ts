import type { Person } from '../types';

const connectors = new Set(['بن', 'ابن', 'بنت']);
const maxCompoundWords = 5;

export function searchPeopleByLineage(people: Person[], query: string, limit?: number): Person[] {
  const tokens = tokenize(query);
  if (!tokens.length) return people;

  const byId = new Map(people.map((person) => [person.id, person]));
  const ranked: Array<{ person: Person; score: number }> = [];

  people.forEach((person) => {
    const score = matchLineage(tokens, getLineage(person, byId, tokens.length + 4));
    if (score !== null) ranked.push({ person, score });
  });

  ranked.sort((a, b) => b.score - a.score || sortOrder(a.person) - sortOrder(b.person));
  const result = ranked.map(({ person }) => person);
  return typeof limit === 'number' ? result.slice(0, limit) : result;
}

export function formatLineageSearchPath(person: Person, byId: Map<number, Person>, maxGenerations = 4): string {
  return getLineage(person, byId, maxGenerations).map(displayOwnName).join(' ← ');
}

function matchLineage(query: string[], lineage: Person[]): number | null {
  const memo = new Map<string, number | null>();

  const visit = (tokenIndex: number, generationIndex: number): number | null => {
    if (tokenIndex === query.length) return 0;
    if (generationIndex >= lineage.length) return null;

    const key = `${tokenIndex}:${generationIndex}`;
    if (memo.has(key)) return memo.get(key) ?? null;

    let best: number | null = null;
    const remaining = query.length - tokenIndex;

    for (let count = 1; count <= Math.min(maxCompoundWords, remaining); count += 1) {
      const phrase = query.slice(tokenIndex, tokenIndex + count);
      const nameScore = scorePhrase(lineage[generationIndex], phrase);
      if (nameScore === null) continue;
      const rest = visit(tokenIndex + count, generationIndex + 1);
      if (rest === null) continue;
      const total = nameScore + rest;
      if (best === null || total > best) best = total;
    }

    memo.set(key, best);
    return best;
  };

  return visit(0, 0);
}

function scorePhrase(person: Person, phraseTokens: string[]): number | null {
  const phraseCompact = phraseTokens.join('');
  let best: number | null = null;

  ownNameAliases(person).forEach((alias) => {
    const aliasTokens = alias.split(' ').filter(Boolean);
    const aliasCompact = aliasTokens.join('');
    let score: number | null = null;

    if (aliasCompact === phraseCompact) score = 120 + phraseTokens.length * 8;
    else if (isPrefix(aliasTokens, phraseTokens)) score = 90 + phraseTokens.length * 6;
    else if (phraseTokens.length === 1 && aliasTokens[0] === phraseTokens[0]) score = 65;

    if (score !== null && (best === null || score > best)) best = score;
  });

  return best;
}

function ownNameAliases(person: Person): string[] {
  const tokens = normalize(person.full_name).split(' ').filter(Boolean);
  const connectorIndex = tokens.findIndex((token) => connectors.has(token));
  const ownTokens = connectorIndex >= 0 ? tokens.slice(0, connectorIndex) : tokens;
  const aliases = new Set<string>();
  if (ownTokens.length) aliases.add(ownTokens.join(' '));
  if (tokens.length) aliases.add(tokens.join(' '));
  const honorific = normalize(person.honorific ?? '');
  if (honorific) aliases.add(honorific);
  return Array.from(aliases);
}

function displayOwnName(person: Person): string {
  const tokens = person.full_name.trim().split(/\s+/);
  const connectorIndex = tokens.findIndex((token) => connectors.has(normalize(token)));
  return (connectorIndex >= 0 ? tokens.slice(0, connectorIndex) : tokens).join(' ') || person.full_name;
}

function getLineage(person: Person, byId: Map<number, Person>, maxGenerations: number): Person[] {
  const result: Person[] = [];
  const visited = new Set<number>();
  let current: Person | undefined = person;

  while (current && result.length < maxGenerations && !visited.has(current.id)) {
    result.push(current);
    visited.add(current.id);
    current = current.lineage_parent_id ? byId.get(current.lineage_parent_id) : undefined;
  }

  return result;
}

function tokenize(query: string): string[] {
  return normalize(query).split(' ').filter(Boolean).filter((token) => !connectors.has(token));
}

function isPrefix(alias: string[], phrase: string[]): boolean {
  return phrase.length <= alias.length && phrase.every((token, index) => alias[index] === token);
}

function sortOrder(person: Person): number {
  return person.chart_order ?? person.generation ?? 999999;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ً-ٰٟۖ-ۭ]/g, '')
    .replace(/ـ/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^0-9a-zء-ي\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
