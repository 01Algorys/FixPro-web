import type { SVGProps } from 'react';

// Filled, two-tone icons for the landing page. They draw in `currentColor`;
// secondary shapes use reduced opacity and cut-outs are white so they read on
// the tinted icon bubbles.
export type IconProps = SVGProps<SVGSVGElement>;
export type Icon = (props: IconProps) => JSX.Element;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      {children}
    </svg>
  );
}

export const DropIcon: Icon = props => (
  <Svg {...props}>
    <path d="M12 2.2c-.33 0-.64.16-.83.43C9.2 5.4 5.2 10.8 5.2 14.8a6.8 6.8 0 0 0 13.6 0c0-4-4-9.4-5.97-12.17A1.02 1.02 0 0 0 12 2.2Z" />
    <path d="M8.8 14.6a3.3 3.3 0 0 0 3.2 3.3" stroke="#fff" strokeOpacity=".75" strokeWidth="1.8" strokeLinecap="round" fill="none" />
  </Svg>
);

export const BoltIcon: Icon = props => (
  <Svg {...props}>
    <path d="M13.9 1.8 4.3 13.4c-.37.45-.05 1.1.52 1.1h5.6l-1.2 7.1c-.1.62.68.97 1.07.48l9.4-11.7c.36-.45.04-1.1-.53-1.1h-5.5l1.42-6.9c.13-.63-.66-1-1.08-.52Z" />
  </Svg>
);

export const SnowIcon: Icon = props => (
  <Svg {...props} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5" />
    <path d="m9.3 3.6 2.7 2.5 2.7-2.5M9.3 20.4l2.7-2.5 2.7 2.5M3.5 10.9l3.5-1.1-.8-3.6M20.5 13.1 17 14.2l.8 3.6M6.2 17.8l.8-3.6-3.5-1.1M17.8 6.2l-.8 3.6 3.5 1.1" />
  </Svg>
);

export const ToolsIcon: Icon = props => (
  <Svg {...props}>
    <g transform="rotate(45 12 12)" opacity=".55">
      <rect x="10" y="1.2" width="4" height="8.5" rx="1.6" />
      <rect x="11.15" y="9" width="1.7" height="12" rx=".85" />
    </g>
    <g transform="rotate(-45 12 12)">
      <rect x="10.7" y="7.5" width="2.6" height="14" rx="1.3" />
      <path d="M8.6 1.9a4.6 4.6 0 0 0 1.8 8.1h3.2a4.6 4.6 0 0 0 1.8-8.1v3.4L12.9 6.6h-1.8L8.6 5.3V1.9Z" />
    </g>
  </Svg>
);

export const RollerIcon: Icon = props => (
  <Svg {...props}>
    <rect x="2.5" y="2.5" width="15" height="7" rx="2.2" />
    <path d="M17.5 6h2a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5H12v3" stroke="currentColor" strokeOpacity=".55" strokeWidth="2" strokeLinejoin="round" fill="none" />
    <rect x="10.3" y="14.3" width="3.4" height="7.4" rx="1.4" />
  </Svg>
);

export const WasherIcon: Icon = props => (
  <Svg {...props}>
    <rect x="3.8" y="2.2" width="16.4" height="19.6" rx="3.2" />
    <circle cx="7.4" cy="5.7" r="1" fill="#fff" />
    <circle cx="10.4" cy="5.7" r="1" fill="#fff" />
    <circle cx="12" cy="14.2" r="5.1" fill="#fff" />
    <path d="M8.6 14.6c1.4-.9 2.6.9 3.9 0s2.4-.6 3 0a3.4 3.4 0 0 1-6.9 0Z" opacity=".55" />
  </Svg>
);

export const BroomIcon: Icon = props => (
  <Svg {...props}>
    <path d="m20.3 2.3-8.1 8.1" stroke="currentColor" strokeOpacity=".55" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    <path d="M10 9.2c.4-.4 1-.4 1.4 0l3.4 3.4c.4.4.4 1 0 1.4l-1 1c-2 2-4.9 3.9-9.3 5.2a.8.8 0 0 1-1-.97C4.8 14.8 6.7 11.9 8.7 9.9l1.3-.7Z" />
    <path d="M7.8 13.6 6 18M10.4 15.2l-2.6 3.5" stroke="#fff" strokeOpacity=".7" strokeWidth="1.3" strokeLinecap="round" />
  </Svg>
);

export const LeafIcon: Icon = props => (
  <Svg {...props}>
    <path d="M20.6 3.2c.2 9.6-2.4 17.6-9.2 17.6-1.9 0-3.4-.6-4.4-1.5.9-3.7 3.2-6.9 7.1-9.6-4.5 1.8-7.7 4.8-9.1 8.5-.8-1-1.3-2.4-1.3-4C3.7 7.4 10.7 3.2 20.6 3.2Z" />
  </Svg>
);

export const ClockIcon: Icon = props => (
  <Svg {...props} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9.2" />
    <path d="M12 6.8V12l3.6 2.2" />
  </Svg>
);

export const ShieldIcon: Icon = props => (
  <Svg {...props}>
    <path d="M11.4 1.9 4.6 4.6c-.6.24-1 .82-1 1.47v5.2c0 5 3.3 8.9 7.8 10.6.38.15.8.15 1.2 0 4.5-1.7 7.8-5.6 7.8-10.6v-5.2c0-.65-.4-1.23-1-1.47l-6.8-2.7a1.6 1.6 0 0 0-1.2 0Z" />
    <path d="m8.3 12 2.6 2.6 4.8-5.1" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

export const CardIcon: Icon = props => (
  <Svg {...props}>
    <rect x="2.2" y="4.5" width="19.6" height="15" rx="3" opacity=".25" />
    <rect x="2.2" y="4.5" width="19.6" height="15" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
    <rect x="2.2" y="8.3" width="19.6" height="3" />
    <rect x="5.2" y="14.6" width="5" height="1.9" rx=".95" />
  </Svg>
);

export const UsersIcon: Icon = props => (
  <Svg {...props}>
    <g opacity=".55">
      <circle cx="5.4" cy="9.4" r="2.5" />
      <circle cx="18.6" cy="9.4" r="2.5" />
      <path d="M.8 18.6c0-2.7 1.9-4.6 4.6-4.6 1 0 1.9.25 2.6.7-1.4 1.2-2.3 2.6-2.5 3.9H.8ZM23.2 18.6c0-2.7-1.9-4.6-4.6-4.6-1 0-1.9.25-2.6.7 1.4 1.2 2.3 2.6 2.5 3.9h4.7Z" />
    </g>
    <circle cx="12" cy="7.9" r="3.5" />
    <path d="M5.6 19.4c0-3.7 2.9-6.2 6.4-6.2s6.4 2.5 6.4 6.2c0 .4-.3.7-.7.7H6.3a.7.7 0 0 1-.7-.7Z" />
  </Svg>
);

export const StarIcon: Icon = props => (
  <Svg {...props}>
    <path d="M11.1 2.6a1 1 0 0 1 1.8 0l2.4 4.9 5.4.8a1 1 0 0 1 .55 1.7l-3.9 3.8.92 5.4a1 1 0 0 1-1.45 1.05L12 17.7l-4.8 2.5a1 1 0 0 1-1.45-1.05l.92-5.4-3.9-3.8a1 1 0 0 1 .55-1.7l5.4-.8 2.4-4.9Z" />
  </Svg>
);

export const HeadsetIcon: Icon = props => (
  <Svg {...props}>
    <path d="M4 14.5V12a8 8 0 0 1 16 0v2.5" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    <rect x="2.4" y="12.2" width="5" height="7.6" rx="2.2" />
    <rect x="16.6" y="12.2" width="5" height="7.6" rx="2.2" />
    <path d="M19.5 19.5c0 1.6-1.6 2.6-4.3 2.6h-1.7" stroke="currentColor" strokeOpacity=".6" strokeWidth="1.8" fill="none" strokeLinecap="round" />
  </Svg>
);

export const ListIcon: Icon = props => (
  <Svg {...props}>
    <circle cx="4.8" cy="6" r="1.9" />
    <circle cx="4.8" cy="12" r="1.9" />
    <circle cx="4.8" cy="18" r="1.9" />
    <rect x="9" y="4.6" width="12.2" height="2.8" rx="1.4" />
    <rect x="9" y="10.6" width="12.2" height="2.8" rx="1.4" opacity=".6" />
    <rect x="9" y="16.6" width="12.2" height="2.8" rx="1.4" />
  </Svg>
);

export const UserIcon: Icon = props => (
  <Svg {...props}>
    <circle cx="12" cy="7.6" r="4.4" />
    <path d="M3.8 20.2c0-4.3 3.7-7.2 8.2-7.2s8.2 2.9 8.2 7.2c0 .5-.4.9-.9.9H4.7a.9.9 0 0 1-.9-.9Z" />
  </Svg>
);

export const CalendarIcon: Icon = props => (
  <Svg {...props}>
    <rect x="2.8" y="4.2" width="18.4" height="17" rx="3.2" />
    <rect x="2.8" y="4.2" width="18.4" height="4.6" rx="2" fill="#fff" fillOpacity=".25" />
    <rect x="6.6" y="2.2" width="2.2" height="4.6" rx="1.1" />
    <rect x="15.2" y="2.2" width="2.2" height="4.6" rx="1.1" />
    <g fill="#fff">
      <rect x="6.3" y="11" width="2.6" height="2.4" rx=".6" />
      <rect x="10.7" y="11" width="2.6" height="2.4" rx=".6" />
      <rect x="15.1" y="11" width="2.6" height="2.4" rx=".6" />
      <rect x="6.3" y="15.4" width="2.6" height="2.4" rx=".6" />
      <rect x="10.7" y="15.4" width="2.6" height="2.4" rx=".6" />
    </g>
  </Svg>
);

export const HouseIcon: Icon = props => (
  <Svg {...props}>
    <path d="M11.1 2.6a1.4 1.4 0 0 1 1.8 0l8.6 7.3c.5.42.2 1.23-.45 1.23H19.6v8.7c0 .8-.6 1.4-1.4 1.4h-3.7v-5.6a1 1 0 0 0-1-1h-3a1 1 0 0 0-1 1v5.6H5.8c-.8 0-1.4-.6-1.4-1.4v-8.7H2.95c-.65 0-.95-.81-.45-1.23l8.6-7.3Z" />
  </Svg>
);

export const DocCheckIcon: Icon = props => (
  <Svg {...props}>
    <path d="M6.2 2h7.6c.4 0 .78.16 1.06.44l4.7 4.7c.28.28.44.66.44 1.06V20.5c0 .83-.67 1.5-1.5 1.5H6.2c-.83 0-1.5-.67-1.5-1.5v-17C4.7 2.67 5.37 2 6.2 2Z" />
    <path d="M14 2.2V7c0 .55.45 1 1 1h4.8" fill="#fff" fillOpacity=".35" />
    <path d="m8.6 14.4 2.3 2.3 4.4-4.6" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

export const PinIcon: Icon = props => (
  <Svg {...props}>
    <path d="M12 1.8a7.6 7.6 0 0 0-7.6 7.6c0 5.1 5.8 11.3 6.9 12.4.4.4 1 .4 1.4 0 1.1-1.1 6.9-7.3 6.9-12.4A7.6 7.6 0 0 0 12 1.8Z" />
    <circle cx="12" cy="9.4" r="2.8" fill="#fff" />
  </Svg>
);

export const ChartIcon: Icon = props => (
  <Svg {...props}>
    <rect x="3" y="13" width="4.2" height="8.5" rx="1.3" opacity=".45" />
    <rect x="9.9" y="9" width="4.2" height="12.5" rx="1.3" opacity=".7" />
    <rect x="16.8" y="4.5" width="4.2" height="17" rx="1.3" />
    <path d="M3.5 9.5 9 5l3.5 2.5 5.5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".6" />
  </Svg>
);

export const ChatIcon: Icon = props => (
  <Svg {...props}>
    <path d="M4.5 3h15A2.5 2.5 0 0 1 22 5.5v10a2.5 2.5 0 0 1-2.5 2.5H10l-4.6 3.6c-.5.4-1.2 0-1.2-.6V18A2.5 2.5 0 0 1 2 15.5v-10A2.5 2.5 0 0 1 4.5 3Z" />
    <g fill="#fff">
      <circle cx="7.6" cy="10.5" r="1.3" />
      <circle cx="12" cy="10.5" r="1.3" />
      <circle cx="16.4" cy="10.5" r="1.3" />
    </g>
  </Svg>
);

export const UserPlusIcon: Icon = props => (
  <Svg {...props}>
    <circle cx="9.5" cy="7.6" r="4.2" />
    <path d="M2 20.2c0-4.1 3.4-6.9 7.5-6.9s7.5 2.8 7.5 6.9c0 .5-.4.9-.9.9H2.9a.9.9 0 0 1-.9-.9Z" />
    <path d="M19.5 6.5v6M16.5 9.5h6" stroke="currentColor" strokeOpacity=".6" strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

export const BriefcaseIcon: Icon = props => (
  <Svg {...props}>
    <path d="M8.6 6.8V5.3c0-.9.7-1.6 1.6-1.6h3.6c.9 0 1.6.7 1.6 1.6v1.5" stroke="currentColor" strokeOpacity=".6" strokeWidth="2" fill="none" />
    <rect x="2.2" y="6.8" width="19.6" height="13.6" rx="2.8" />
    <rect x="2.2" y="12" width="19.6" height="1.8" fill="#fff" fillOpacity=".35" />
    <rect x="10.4" y="11.2" width="3.2" height="3.4" rx=".8" fill="#fff" />
  </Svg>
);

export const QuoteIcon: Icon = props => (
  <Svg {...props}>
    <path d="M3 18.5v-5.3C3 8.6 5.4 5.6 9.6 4.5l.9 2c-2.3.9-3.5 2.6-3.6 4.9H10v7.1H3Zm10.9 0v-5.3c0-4.6 2.4-7.6 6.6-8.7l.9 2c-2.3.9-3.5 2.6-3.6 4.9h3.1v7.1h-7Z" />
  </Svg>
);

export const LockIcon: Icon = props => (
  <Svg {...props}>
    <path d="M7.5 10.5V7.8a4.5 4.5 0 0 1 9 0v2.7" stroke="currentColor" strokeOpacity=".6" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <rect x="4" y="10" width="16" height="12" rx="3" />
    <circle cx="12" cy="15.3" r="1.7" fill="#fff" />
    <rect x="11.2" y="15.6" width="1.6" height="3.3" rx=".8" fill="#fff" />
  </Svg>
);
