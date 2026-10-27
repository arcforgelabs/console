// The Arc Forge mark, from arcforge.au/assets/site/af-mark-ink.svg.
// It takes the text colour, so it works on light and dark themes.
// The sign-in theme (theme/) imports this file too, so keep it free of
// path aliases.
export function ArcForgeMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox='0 0 550.15 581.06'
      fill='currentColor'
      role='img'
      aria-label='Arc Forge'
      {...props}
    >
      <g transform='scale(0.921405,0.937198)'>
        <path d='m 302.5,0 22.5,37.5 4,5 13,23 4,5 10,18 4,5 13,23 4,5 13,23 4,5 13,23 4,5 9,15 2,5.5 H 326.5 L 325,196.5 306.5,172 266,239.5 l -2,5 -8,12 -2,5 -11,17 -2,5 -8,12 -2,5 -8,12 -2,5 -8,12 -2,5 -11,17 -2,5 -8,12 -2,5 -8,12 -2,5 -11,17 -2,5 -18,29 -12,22 -11,17 -2,5 -18,29 -2,5 -5.5,7.5 -96.5,-0.5 9,-14 26,-47 5,-7 26,-47 5,-7 26,-47 5,-7 26,-47 5,-7 26,-47 5,-7 2,-5 2,-2 2,-5 2,-2 2,-5 18,-30 2,-5 5,-7 2,-5 2,-2 2,-5 2,-2 2,-5 21,-35 2,-5 2,-2 2,-5 2,-2 2,-5 2,-2 2,-5 17,-28 2,-5 2,-2 2,-5 2,-2 2,-5 2,-2 2,-5 2,-2 2,-5 2,-2 2,-5 9,-14 z' />
        <path d='m 321.5,247 h 275 q 0.8,-0.2 0.5,2.5 l -27,41 -8,14 -8,11 -1,3 -4.5,5.5 h -253 l -1,1 H 276 v -2.5 z' />
        <path d='M 246.5,375 492,375.5 436.5,448 h -36 l -1,-1 h -24 l -1.5,1.5 v 74 l -1,3 -73,93 v 1.5 l -2,-0.5 v -142 q 2,-1 0,-2 v -9 q -1.7,-0.7 -1,-4 l -7,-16 -23,-36 -15,-26 -4,-5 -2,-4 z' />
      </g>
    </svg>
  )
}
