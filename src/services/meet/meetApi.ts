import { getAccessToken } from './meetAuth.ts';
import { MeetSpace } from '../../types/index.ts';

/**
 * Extracts a Google Meet code (e.g., 'xyz-abcd-rst') from a URL or raw string.
 */
export function extractMeetCode(input: string): string | null {
  if (!input) return null;
  const match = input.match(/(?:meet\.google\.com\/)?([a-z]{3}-[a-z]{4}-[a-z]{3})/i);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Creates a new Google Meet space using the Google Meet REST API v2.
 */
export async function createGoogleMeetSpace(): Promise<MeetSpace> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Please sign in with Google to create and link a Google Meet space.');
  }

  const res = await fetch('https://meet.googleapis.com/v2/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create Google Meet space (HTTP ${res.status})`);
  }

  const data = await res.json();
  return {
    name: data.name,
    meetingUri: data.meetingUri,
    meetingCode: data.meetingCode,
    config: data.config,
  };
}

/**
 * Retrieves an existing Google Meet space by space name (e.g., 'spaces/XXXXXXXX')
 */
export async function getGoogleMeetSpace(spaceName: string): Promise<MeetSpace> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Please sign in with Google to retrieve Google Meet spaces.');
  }

  const cleanName = spaceName.startsWith('spaces/') ? spaceName : `spaces/${spaceName}`;
  const res = await fetch(`https://meet.googleapis.com/v2/${cleanName}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Meet space ${spaceName}`);
  }

  const data = await res.json();
  return {
    name: data.name,
    meetingUri: data.meetingUri,
    meetingCode: data.meetingCode,
    config: data.config,
  };
}
