export const colors = {
  // Primary palette
  navy: '#0B1B3A',
  navyLight: '#142451',
  navy2: 'rgba(255,255,255,0.12)',   // subtle surface on navy bg
  navyText: 'rgba(255,255,255,0.6)', // muted text on navy
  teal: '#1D9E75',
  tealLight: '#22B584',
  tealFaint: 'rgba(29,158,117,0.12)',

  // Backgrounds
  bg: '#F0F2F8',
  card: '#FFFFFF',
  surface: '#FFFFFF',

  // Text
  text: '#0F1B35',
  textSec: '#6B7A99',   // secondary / muted text (alias for muted)
  textLight: '#FFFFFF',
  muted: '#6B7A99',
  mutedLight: '#9AA3BB',

  // Border
  border: '#DDE2EF',

  // Semantic / module colors
  green: '#22C55E',
  blue: '#3B82F6',
  purple: '#A855F7',
  orange: '#F97316',
  pink: '#EC4899',
  red: '#EF4444',

  // Keep primary alias pointing to teal for single-color usage
  primary: '#1D9E75',
  primaryDark: '#178A65',
};

export const statusStyle = {
  pending:     { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
  'in-progress': { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  ready:       { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  delivered:   { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
  cancelled:   { bg: '#FFF1F2', text: '#BE123C', dot: '#EF4444' },
};

export const moduleColor = {
  desk:    { icon: 'grid',     bg: 'rgba(29,158,117,0.12)',  fg: '#1D9E75', soft: 'rgba(29,158,117,0.12)'  },
  clients: { icon: 'people',   bg: 'rgba(59,130,246,0.12)', fg: '#3B82F6', soft: 'rgba(59,130,246,0.12)'  },
  eyewear: { icon: 'glasses',  bg: 'rgba(168,85,247,0.12)', fg: '#A855F7', soft: 'rgba(168,85,247,0.12)'  },
  lenses:  { icon: 'eye',      bg: 'rgba(249,115,22,0.12)', fg: '#F97316', soft: 'rgba(249,115,22,0.12)'  },
  atelier: { icon: 'construct',bg: 'rgba(234,179,8,0.12)',  fg: '#CA8A04', soft: 'rgba(234,179,8,0.12)'   },
  orders:  { icon: 'receipt',  bg: 'rgba(236,72,153,0.12)', fg: '#EC4899', soft: 'rgba(236,72,153,0.12)'  },
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, full: 9999 };
export const space  = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };
export const shadow = {
  card: { shadowColor: '#0B1B3A', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  header: { shadowColor: '#0B1B3A', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
};
