import type { DependencyGraphData } from './types';

/**
 * Calls the backend to analyze a project directory.
 * Returns the dependency graph JSON.
 */
export async function analyzeProject(projectPath: string): Promise<DependencyGraphData> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectPath }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return res.json();
}
