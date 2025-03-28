import { SupportTicket_status, SupportTicket_priority } from '@prisma/client';

export { SupportTicket_status, SupportTicket_priority };

export interface SupportTicketMessage {
  sender: 'user' | 'admin';
  content: string;
  timestamp: Date;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  category: string;
  subject: string;
  description: string;
  status: SupportTicket_status;
  priority: SupportTicket_priority;
  response?: string | null;
  respondedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  userReply?: string | null;
  messages?: SupportTicketMessage[] | null;
}

export type TicketCategory = 
  | 'TECHNICAL'
  | 'BILLING'
  | 'ACCOUNT'
  | 'BOOKINGS'
  | 'OTHER';

export const TICKET_CATEGORIES: TicketCategory[] = [
  'TECHNICAL',
  'BILLING',
  'ACCOUNT',
  'BOOKINGS',
  'OTHER'
];

export const TICKET_STATUS_LABELS: Record<SupportTicket_status, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed'
};

export const TICKET_PRIORITY_LABELS: Record<SupportTicket_priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent'
};

export const TICKET_PRIORITY_COLORS: Record<SupportTicket_priority, string> = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-green-100 text-green-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800'
};

export const TICKET_STATUS_COLORS: Record<SupportTicket_status, string> = {
  OPEN: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800'
}; 