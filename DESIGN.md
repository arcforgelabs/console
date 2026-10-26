# Design

- Base: shadcn/ui components as shipped by shadcn-admin. Prefer a stock
  component over a custom one.
- Theme: Arc Forge tokens in `src/styles/theme.css` (dark first, red accent
  `#e5243b`, Geist and JetBrains Mono). The tokens will move to the shared
  `arcforgelabs/themes` engine when it is ready.
- Claws show as cards: label, host in mono, status, version, Open.
- Check every page at desktop and phone width (390px) in light and dark.
  No sideways scroll.
