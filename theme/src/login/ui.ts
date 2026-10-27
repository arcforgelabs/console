// Shared class strings for our own sign-in pages (pages/*.tsx).
export const input =
  'h-10 w-full rounded-md border border-input bg-transparent px-3 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm'

export const codeInput = `${input} h-12 text-center font-mono text-xl! tracking-[0.4em]`

const button =
  'inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50'

export const primaryButton = `${button} bg-primary text-primary-foreground shadow-xs hover:bg-primary/90`

export const secondaryButton = `${button} border bg-background shadow-xs hover:bg-accent`

// A quiet text link or link-style button, for the one alternative on a page.
export const quietLink =
  'cursor-pointer text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'

export const summary =
  'cursor-pointer text-center text-sm text-muted-foreground hover:text-foreground'
