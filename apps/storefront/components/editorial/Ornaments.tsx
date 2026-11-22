// Decorative inline SVGs for the Our Story / From Our Land pages. They use currentColor, so colour comes from CSS.
export function Branch({ className }: { className?: string }) {
  const leaves = [30, 58, 86, 114, 142, 170, 198];
  return (<svg viewBox="0 0 240 64" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
    <path d="M4 34 Q70 26 120 32 T236 28" />
    {leaves.map((x, i) => { const up = i % 2 === 0, y = up ? 21 : 45; return <ellipse key={x} cx={x} cy={y} rx="11" ry="3.6" transform={`rotate(${up ? -30 : 30} ${x} ${y})`} />; })}
    <circle cx="152" cy="41" r="4" fill="currentColor" stroke="none" /><circle cx="180" cy="23" r="4" fill="currentColor" stroke="none" />
  </svg>);
}
export function Tree({ className }: { className?: string }) {
  return (<svg viewBox="0 0 200 220" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
    <circle cx="100" cy="72" r="48" fill="currentColor" fillOpacity=".07" /><circle cx="56" cy="98" r="32" fill="currentColor" fillOpacity=".07" /><circle cx="146" cy="94" r="34" fill="currentColor" fillOpacity=".07" />
    <path d="M100 214 C98 172 96 148 90 118 M100 214 C103 172 108 142 118 112 M92 150 C72 140 58 126 50 108 M108 142 C130 132 146 118 152 98" />
    <path d="M70 70 q6 -8 14 -2 M112 52 q8 -6 14 2 M96 92 q8 -6 14 0 M60 100 q6 -6 12 0 M138 96 q6 -6 12 0" />
  </svg>);
}
export function Hills({ className }: { className?: string }) {
  return (<svg viewBox="0 0 1200 120" preserveAspectRatio="none" className={className} aria-hidden="true">
    <path d="M0 84 C190 22 370 112 600 64 S1010 22 1200 74 V120 H0 Z" fill="currentColor" fillOpacity=".14" />
    <path d="M0 102 C220 58 420 120 640 92 S1000 62 1200 98 V120 H0 Z" fill="currentColor" fillOpacity=".2" />
  </svg>);
}
export function Leaf({ className }: { className?: string }) {
  return (<svg viewBox="0 0 40 20" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M3 10 Q20 -4 37 10 Q20 24 3 10 Z" /><path d="M3 10 H37" /></svg>);
}
export function Divider({ className }: { className?: string }) {
  return <div className={"ed-divider " + (className || "")} aria-hidden="true"><span /><Leaf className="ed-leaf" /><span /></div>;
}
