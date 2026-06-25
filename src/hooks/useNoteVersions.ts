export interface NoteVersion {
  id: string;
  noteId: string;
  title: string;
  content: string;
  savedAt: string;
}

const KEY = 'ar_note_versions';

function loadAll(): Record<string, NoteVersion[]> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, NoteVersion[]>) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getNoteVersions(noteId: string): NoteVersion[] {
  return loadAll()[noteId] || [];
}

export function saveNoteVersion(noteId: string, title: string, content: string): NoteVersion {
  const all = loadAll();
  const list = all[noteId] || [];
  const version: NoteVersion = {
    id: `v_${Date.now()}`,
    noteId,
    title,
    content,
    savedAt: new Date().toISOString()
  };
  const updated = [version, ...list].slice(0, 20);
  all[noteId] = updated;
  saveAll(all);
  return version;
}

export function deleteNoteVersion(noteId: string, versionId: string) {
  const all = loadAll();
  all[noteId] = (all[noteId] || []).filter(v => v.id !== versionId);
  saveAll(all);
}
