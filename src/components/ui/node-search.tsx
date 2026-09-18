import { useCallback, useState } from 'react'

import {
  Panel,
  useReactFlow,
  type BuiltInEdge,
  type Node,
  type PanelProps,
} from '@xyflow/react'

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
      return nodes.filter((node) => {
        const label = String((node.data as Record<string, unknown>)?.label ?? '').toLowerCase()
        // support both data.nodeType and node.type
        const nodeType = String(
          (node.data as Record<string, unknown>)?.nodeType ??
            (node as unknown as Record<string, unknown>)?.type ??
            '',
        ).toLowerCase()
        const id = String(node.id).toLowerCase()
        return label.includes(lower) || nodeType.includes(lower) || id.includes(lower)
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
        setSearchResults([])
        onOpenChange?.(false)
      }
    },
    [defaultOnSearch, onOpenChange, onSearch],
  )

  const defaultOnSelectNode = useCallback(
    (node: Node) => {
      setNodes((nodes) => nodes.map((n) => (n.id === node.id ? { ...n, selected: true } : { ...n, selected: false })))
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
      <CommandInput placeholder={placeholder} onValueChange={onChange} value={searchString} onFocus={() => onOpenChange?.(true)} />
      {open ? (
        <CommandList>
          {searchResults.length === 0 ? (
            <CommandEmpty>
              {emptyText} {searchString ? `"${searchString}"` : ''}
            </CommandEmpty>
          ) : (
            <CommandGroup heading="Nodes">
              {searchResults.map((node) => {
                const label = String((node.data as Record<string, unknown>)?.label ?? node.id)
                const nodeType = String((node.data as Record<string, unknown>)?.nodeType ?? '')
                return (
                  <CommandItem key={node.id} value={node.id} onSelect={() => onSelect(node)}>
                    <span className="flex flex-col">
                      <span>{label}</span>
                      {nodeType ? <span className="text-muted-foreground text-xs">{nodeType}</span> : null}
                    </span>
                    <span className="text-muted-foreground ml-auto text-xs">{node.id}</span>
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
  const { className: panelClassName, style: panelStyle, ...restPanelProps } = panelProps as PanelProps & {
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
      <Command
        shouldFilter={false}
        className={cn('rounded-lg border shadow-md md:min-w-[350px] bg-popover', className)}
      >
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
