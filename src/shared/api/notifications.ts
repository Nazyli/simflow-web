import { apiClient } from './client'

export interface ChatActivityItem {
  actor_id: string
  content: string
  unread_count: number
}

export interface NotificationActivity {
  activity_chat: ChatActivityItem[]
  activity_email: unknown[]
}

export const getNotificationActivity = (participantId: string) =>
  apiClient<NotificationActivity>(
    `/runner/notifications/activity?participant_id=${encodeURIComponent(participantId)}`,
  )
