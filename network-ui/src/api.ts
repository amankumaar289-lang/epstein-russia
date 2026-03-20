import type { Stats, GraphData, Person, PersonDetail, DocumentRecord, TimelineEvent, SearchResult } from './types';

const API_BASE = '/api';

export async function fetchStats(): Promise<Stats> {
  const response = await fetch(`${API_BASE}/stats`);
  if (!response.ok) throw new Error('Не удалось загрузить статистику');
  return response.json();
}

export async function fetchGraph(): Promise<GraphData> {
  const response = await fetch(`${API_BASE}/graph`);
  if (!response.ok) throw new Error('Не удалось загрузить граф');
  return response.json();
}

export async function fetchPersons(): Promise<Person[]> {
  const response = await fetch(`${API_BASE}/persons`);
  if (!response.ok) throw new Error('Не удалось загрузить персоны');
  return response.json();
}

// Одна персона (с деталями, связями и документами)
// API возвращает { person, relations, documents, connected_persons }
export async function fetchPerson(id: string): Promise<PersonDetail> {
  const response = await fetch(`${API_BASE}/person/${encodeURIComponent(id)}`);
  if (!response.ok) throw new Error('Не удалось загрузить данные персоны');
  // Сервер возвращает { person, relations, documents, connected_persons }
  // Это совпадает с PersonDetail
  return response.json();
}

export async function fetchRelations(): Promise<{ relations: any[]; total: number }> {
  const response = await fetch(`${API_BASE}/relations`);
  if (!response.ok) throw new Error('Не удалось загрузить связи');
  return response.json();
}

export async function fetchDocuments(): Promise<DocumentRecord[]> {
  const response = await fetch(`${API_BASE}/documents`);
  if (!response.ok) throw new Error('Не удалось загрузить документы');
  return response.json();
}

export async function fetchDocument(docId: string): Promise<DocumentRecord> {
  const response = await fetch(`${API_BASE}/document/${encodeURIComponent(docId)}`);
  if (!response.ok) throw new Error('Не удалось загрузить документ');
  return response.json();
}

export async function fetchTimeline(): Promise<TimelineEvent[]> {
  const response = await fetch(`${API_BASE}/timeline`);
  if (!response.ok) throw new Error('Не удалось загрузить хронологию');
  return response.json();
}

export async function searchAll(query: string): Promise<SearchResult> {
  const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Ошибка поиска');
  return response.json();
}

export async function healthCheck(): Promise<{ status: string }> {
  const response = await fetch('/health');
  if (!response.ok) throw new Error('Сервер не отвечает');
  return response.json();
}
