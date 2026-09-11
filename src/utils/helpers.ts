import { Workspace } from '../types/workspace';

// Generic helpers can go here
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Formats a timestamp into a relative time string.
 * Buckets: "Just now", "X minutes ago", "X hours ago", "Yesterday", "X days ago".
 * Falls back to short date for > 7 days.
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;

  // If future or < 1 minute
  if (diffMs < 60 * 1000) {
    return 'Just now';
  }

  const diffMins = Math.floor(diffMs / (60 * 1000));
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 1) {
    return 'Yesterday';
  }

  if (diffDays <= 7) {
    return `${diffDays} days ago`;
  }

  // Fallback to short date
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Filters workspaces based on a search query.
 * Matches against workspace name, tab title, and tab URL (case-insensitive).
 */
export function filterWorkspaces(workspaces: Workspace[], query: string): Workspace[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return workspaces;

  return workspaces.filter(workspace => {
    if (workspace.name.toLowerCase().includes(trimmed)) return true;
    
    return workspace.tabs.some(tab => 
      tab.title.toLowerCase().includes(trimmed) || 
      tab.url.toLowerCase().includes(trimmed)
    );
  });
}
