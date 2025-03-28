import { format, formatDistance } from 'date-fns';

export function formatDate(date: Date | string): string {
  const dateObj = new Date(date);
  return format(dateObj, 'MMM d, yyyy');
}

export function formatDateTime(date: Date | string): string {
  const dateObj = new Date(date);
  return format(dateObj, 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(date: Date | string): string {
  const dateObj = new Date(date);
  return formatDistance(dateObj, new Date(), { addSuffix: true });
} 