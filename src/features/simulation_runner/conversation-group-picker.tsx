import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageCircleMore } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { submitExecutionAction } from '../../shared/api/executions'
import type { Execution } from '../../shared/types/workflow'

type GroupProgress = {
  groups?: unknown
  done?: unknown
  active?: unknown
  labels?: unknown
}

function waitingGroup(execution: Execution): GroupProgress | null {
  const groups = execution.context.conversation_groups
  if (!execution.current_node_id || typeof groups !== 'object' || groups === null) return null
  const progress = (groups as Record<string, unknown>)[execution.current_node_id]
  return typeof progress === 'object' && progress !== null ? (progress as GroupProgress) : null
}

export function ConversationGroupPicker({ execution }: { execution: Execution }) {
  const queryClient = useQueryClient()
  const progress = waitingGroup(execution)
  const groups = Array.isArray(progress?.groups)
    ? progress.groups.filter((item): item is string => typeof item === 'string')
    : []
  const done = new Set(
    Array.isArray(progress?.done)
      ? progress.done.filter((item): item is string => typeof item === 'string')
      : [],
  )
  const labels =
    typeof progress?.labels === 'object' && progress.labels !== null
      ? (progress.labels as Record<string, unknown>)
      : {}
  const options = groups.filter((id) => !done.has(id))
  const chooseGroup = useMutation({
    mutationFn: (groupId: string) =>
      submitExecutionAction(execution.execution_id, {
        action_type: 'choose_group',
        group_id: groupId,
        payload: {},
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['participant-executions'] }),
  })

  if (execution.status !== 'waiting' || progress?.active || !options.length) return null

  return (
    <section className="mt-4 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-violet-900">
        <MessageCircleMore className="size-4" /> Choose a conversation group
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((id) => (
          <Button
            key={id}
            size="sm"
            disabled={chooseGroup.isPending}
            onClick={() => chooseGroup.mutate(id)}
          >
            {typeof labels[id] === 'string' ? labels[id] : id}
          </Button>
        ))}
      </div>
    </section>
  )
}
