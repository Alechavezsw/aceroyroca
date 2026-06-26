import { MINING_PROJECTS, type MiningProject } from '../data/miningProjects';

export const DEFAULT_WATCHLIST = ['los-azules', 'josemaria', 'veladero'];

export function getProjectKeywords(project: MiningProject): string[] {
  const keywords = new Set<string>();
  keywords.add(project.name.toLowerCase());

  project.name.split(/[\s-]+/).forEach(part => {
    if (part.length >= 4) keywords.add(part.toLowerCase());
  });

  project.operator.split(/[/,]/).forEach(op => {
    const trimmed = op.trim();
    if (trimmed.length >= 4) keywords.add(trimmed.toLowerCase());
  });

  if (project.province.includes('/')) {
    project.province.split('/').forEach(p => keywords.add(p.trim().toLowerCase()));
  } else {
    keywords.add(project.province.toLowerCase());
  }

  return Array.from(keywords);
}

export function matchNewsToProjects(
  text: string,
  watchlistIds: string[]
): { projectId: string; projectName: string }[] {
  const lower = text.toLowerCase();
  const matches: { projectId: string; projectName: string }[] = [];

  for (const id of watchlistIds) {
    const project = MINING_PROJECTS.find(p => p.id === id);
    if (!project) continue;
    const hit = getProjectKeywords(project).some(kw => lower.includes(kw));
    if (hit) matches.push({ projectId: id, projectName: project.name });
  }

  return matches;
}

export function getWatchlistProjectNames(ids: string[]): string[] {
  return ids
    .map(id => MINING_PROJECTS.find(p => p.id === id)?.name)
    .filter(Boolean) as string[];
}

export function loadWatchlist(): string[] {
  try {
    const raw = localStorage.getItem('ar_watchlist');
    if (raw) return JSON.parse(raw);
  } catch { /* fallthrough */ }
  return DEFAULT_WATCHLIST;
}

export function saveWatchlist(ids: string[]): void {
  localStorage.setItem('ar_watchlist', JSON.stringify(ids));
}
