export const PARTICIPANT_GENDERS = ['Male', 'Female'] as const
export const PARTICIPANT_LANGUAGES = ['Bahasa Indonesia', 'English'] as const

export type ParticipantGender = (typeof PARTICIPANT_GENDERS)[number]
export type ParticipantLanguage = (typeof PARTICIPANT_LANGUAGES)[number]

export interface RunnerParticipantProfile {
  participantFullName: string
  participantGender: ParticipantGender
  participantLanguage: ParticipantLanguage
  participantActorId: string
}

export const DEFAULT_RUNNER_PARTICIPANT_PROFILE: RunnerParticipantProfile = {
  participantFullName: '',
  participantGender: 'Male',
  participantLanguage: 'Bahasa Indonesia',
  participantActorId: '',
}
