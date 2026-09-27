import { useCallback, useState } from 'react'

import { Panel, useReactFlow, type BuiltInEdge, type Node, type PanelProps } from '@xyflow/react'

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'

const nodeSearchCommandClasses = [
  'bg-popover rounded-lg border shadow-md md:min-w-[15rem]',
  '[&_[cmdk-empty]]:py-3 [&_[cmdk-empty]]:text-[0.6875rem] [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:py-0.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group]]:p-0',
  '[&_[cmdk-input-wrapper]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-3 [&_[cmdk-input-wrapper]_svg]:w-3 [&_[cmdk-input]]:h-7 [&_[cmdk-input]]:px-1 [&_[cmdk-input]]:py-0.5 [&_[cmdk-input]]:text-[0.6875rem] max-[760px]:[&_[cmdk-input]]:h-11 max-[760px]:[&_[cmdk-input]]:text-xs',
  '[&_[cmdk-item]]:min-h-0 [&_[cmdk-item]]:gap-1 [&_[cmdk-item]]:px-1 [&_[cmdk-item]]:py-0.5 [&_[cmdk-item]]:text-[0.6875rem] max-[760px]:[&_[cmdk-item]]:min-h-11 max-[760px]:[&_[cmdk-item]]:text-xs [&_[cmdk-item]_svg]:size-3 [&_[cmdk-list]]:max-h-44',
].join(' ')

export interface NodeSearchProps extends Omit<PanelProps, 'children'> {
  /**
   * Custom search function — should return nodes matching the search string.
   * By default does lowercase substring match against node.data.label, node.data.nodeType and node.id
   */
  onSearch?: (searchString: string) => Node[]
  /**
   * Custom select handler — by default sets node selected and fits view.
   */
  onSelectNode?: (node: Node) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  placeholder?: string
  emptyText?: string
}

export function NodeSearchInternal({
  onSearch,
  onSelectNode,
  open,
  onOpenChange,
  placeholder = 'Search nodes...',
  emptyText = 'No results found.',
}: NodeSearchProps) {
  const [searchResults, setSearchResults] = useState<Node[]>([])
  const [searchString, setSearchString] = useState<string>('')
  const { getNodes, fitView, setNodes } = useReactFlow<Node, BuiltInEdge>()

  const defaultOnSearch = useCallback(
    (q: string) => {
      const nodes = getNodes()
      const lower = q.toLowerCase()
      if (!lower) return nodes
      return nodes.filter((node) => {
        const data = node.data as Record<string, unknown>
        const groupName = String(
          (data?.group as Record<string, unknown> | undefined)?.groupName ?? '',
        ).toLowerCase()
        const label = String(
          (data?.group as Record<string, unknown> | undefined)?.groupName ?? data?.label ?? '',
        ).toLowerCase()
        // support both data.nodeType and node.type
        const nodeType = String(
          data?.nodeType ?? (node as unknown as Record<string, unknown>)?.type ?? '',
        ).toLowerCase()
        const id = String(node.id).toLowerCase()
        return (
          label.includes(lower) ||
          groupName.includes(lower) ||
          nodeType.includes(lower) ||
          id.includes(lower)
        )
      })
    },
    [getNodes],
  )

  const onChange = useCallback(
    (value: string) => {
      setSearchString(value)
      if (value.length > 0) {
        onOpenChange?.(true)
        const results = (onSearch ?? defaultOnSearch)(value)
        setSearchResults(results)
      } else {
        // empty query → show full list instead of clearing
        const all = getNodes()
        const results = onSearch ? onSearch(value) : all
        // if custom onSearch returns empty for "", fallback to all nodes
        setSearchResults(results.length > 0 || value !== '' ? results : all)
        onOpenChange?.(true)
      }
    },
    [defaultOnSearch, getNodes, onOpenChange, onSearch],
  )

  const onFocus = useCallback(() => {
    onOpenChange?.(true)
    if (searchString.length === 0) {
      const all = getNodes()
      const results = onSearch ? onSearch('') : all
      setSearchResults(results.length > 0 ? results : all)
    }
  }, [getNodes, onOpenChange, onSearch, searchString])

  const defaultOnSelectNode = useCallback(
    (node: Node) => {
      setNodes((nodes) =>
        nodes.map((n) => (n.id === node.id ? { ...n, selected: true } : { ...n, selected: false })),
      )
      void fitView({ nodes: [node], duration: 500 })
    },
    [fitView, setNodes],
  )

  const onSelect = useCallback(
    (node: Node) => {
      const handler = onSelectNode ?? defaultOnSelectNode
      handler(node)
      setSearchString('')
      setSearchResults([])
      onOpenChange?.(false)
    },
    [defaultOnSelectNode, onOpenChange, onSelectNode],
  )

  return (
    <>
      <CommandInput
        placeholder={placeholder}
        onValueChange={onChange}
        value={searchString}
        onFocus={onFocus}
        onBlur={() => onOpenChange?.(false)}
      />
      {open ? (
        <CommandList>
          {searchResults.length === 0 ? (
            searchString.length > 0 ? (
              <CommandEmpty>
                {emptyText} {`"${searchString}"`}
              </CommandEmpty>
            ) : (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )
          ) : (
            <CommandGroup heading="Nodes">
              {searchResults.map((node) => {
                const data = node.data as Record<string, unknown>
                const groupName = (data?.group as Record<string, unknown> | undefined)
                  ?.groupName as string | undefined
                const label = String(groupName ?? data?.label ?? node.id)
                const nodeType = String(
                  (data?.nodeType as string | undefined) ??
                    ((node as unknown as Record<string, unknown>)?.type as string | undefined) ??
                    '',
                )
                // For visualGroup, show type as secondary hint; otherwise nodeType
                const secondary = groupName ? nodeType || 'visualGroup' : nodeType
                return (
                  <CommandItem
                    key={node.id}
                    value={node.id}
                    onPointerDown={(event) => event.preventDefault()}
                    onSelect={() => onSelect(node)}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate">{label}</span>
                      {secondary ? (
                        <span className="text-muted-foreground truncate text-[10px] leading-3">
                          {secondary}
                        </span>
                      ) : null}
                    </span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
        </CommandList>
      ) : null}
    </>
  )
}

/**
 * NodeSearch — inline Panel wrapper around Command + NodeSearchInternal.
 * Must be used inside <ReactFlow>. Supports Panel positioning via PanelProps.
 * Uses cmdk Command with shouldFilter=false and manual filtering.
 */
export function NodeSearch({
  className,
  onSearch,
  onSelectNode,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  placeholder,
  emptyText,
  position = 'top-center',
  ...panelProps
}: NodeSearchProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const onOpenChange = controlledOnOpenChange ?? setInternalOpen

  // Separate Panel className from Command className
  const {
    className: panelClassName,
    style: panelStyle,
    ...restPanelProps
  } = panelProps as PanelProps & {
    className?: string
    style?: React.CSSProperties
  }

  return (
    <Panel
      position={position}
      className={cn('bg-transparent p-0', panelClassName)}
      style={panelStyle}
      {...restPanelProps}
    >
      <Command shouldFilter={false} className={cn(nodeSearchCommandClasses, className)}>
        <NodeSearchInternal
          onSearch={onSearch}
          onSelectNode={onSelectNode}
          open={open}
          onOpenChange={onOpenChange}
          placeholder={placeholder}
          emptyText={emptyText}
        />
      </Command>
    </Panel>
  )
}

export interface NodeSearchDialogProps extends NodeSearchProps {
  title?: string
}

export function NodeSearchDialog({
  className,
  onSearch,
  onSelectNode,
  open,
  onOpenChange,
  placeholder,
  emptyText,
  ...props
}: NodeSearchDialogProps) {
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <div className={cn('md:min-w-[350px]', className)}>
        <NodeSearchInternal
          onSearch={onSearch}
          onSelectNode={onSelectNode}
          open={open}
          onOpenChange={onOpenChange}
          placeholder={placeholder}
          emptyText={emptyText}
          {...props}
        />
      </div>
    </CommandDialog>
  )
}
