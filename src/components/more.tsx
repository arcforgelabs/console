import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

type MoreProps = {
  label: React.ReactNode
  children: React.ReactNode
  className?: string
}

// Progressive disclosure: anything that is not the page's one main task
// stays closed behind a quiet label until someone asks for it.
export function More({ label, children, className }: MoreProps) {
  return (
    <Collapsible className={cn('group/more', className)}>
      <CollapsibleTrigger className='inline-flex cursor-pointer items-center gap-1 rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50'>
        {label}
        <ChevronDown className='size-4 transition-transform group-data-[state=open]/more:rotate-180' />
      </CollapsibleTrigger>
      <CollapsibleContent className='pt-3'>{children}</CollapsibleContent>
    </Collapsible>
  )
}
