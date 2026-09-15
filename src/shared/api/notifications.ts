import { apiClient } from './client'

export interface ChatActivityItem {
  actorId: string
  content: string
  unreadCount: number
}

export interface EmailActivityItem {
  actorId: string
  subject: string
  content: string
  unreadCount: number
}

export interface NotificationActivity {
  activityChat: ChatActivityItem[]
  activityEmail: EmailActivityItem[]
}

export const getNotificationActivity = (participantId: string) =>
  apiClient<NotificationActivity>(
    `/web/notifications/activity?participantId=${encodeURIComponent(participantId)}`,
  )
