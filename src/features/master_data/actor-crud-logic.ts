import type { MasterActor } from '../../shared/api/master-data'
import { renderMarkdown } from '../documentation/markdown'

export interface ActorFormValues {
  actorId: string
  actorName: string
  actorEmail: string
  actorPosition: string
  actorGroupPosition: string
  personaDesc: string
  isParticipant: boolean
}

export function emptyActorForm(): ActorFormValues {
  return {
    actorId: '',
    actorName: '',
    actorEmail: '',
    actorPosition: '',
    actorGroupPosition: '',
    personaDesc: '',
    isParticipant: false,
  }
}

export function actorFormFromRecord(record: MasterActor): ActorFormValues {
  return {
    actorId: record.actorId ?? '',
    actorName: record.actorName ?? '',
    actorEmail: record.actorEmail ?? '',
    actorPosition: record.actorPosition ?? '',
    actorGroupPosition: record.actorGroupPosition ?? '',
    personaDesc: record.personaDesc ?? '',
    isParticipant: record.isParticipant ?? false,
  }
}

export function validateActorForm(values: ActorFormValues, editing: boolean): string | null {
  if (!editing && !values.actorId.trim()) return 'Enter an actor ID.'
  if (!values.actorName.trim()) return 'Enter a name.'
  return null
}

export function renderActorPersonality(value: string | null | undefined): string {
  return renderMarkdown(value ?? '')
}
