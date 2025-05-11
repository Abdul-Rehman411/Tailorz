const svgProps = {
  width: "24",
  height: "24",
  viewBox: "0 0 24 24",
  strokeWidth: "2",
  stroke: "currentColor",
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const EditIcon = ({ size, color, extraClasses }) => (
  <svg {...svgProps} className={`h-${size} w-${size} ${color} ${extraClasses}`}>
    <path stroke="none" d="M0 0h24v24H0z" />
    <path d="M9 7 h-3a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-3" />
    <path d="M9 15h3l8.5 -8.5a1.5 1.5 0 0 0 -3 -3l-8.5 8.5v3" />
    <line x1="16" y1="5" x2="19" y2="8" />
  </svg>
);

const SettingsIcon = ({ size, color, extraClasses }) => (
  <svg {...svgProps} className={`h-${size} w-${size} ${color} ${extraClasses}`}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const LogoutIcon = ({ size, color, extraClasses }) => (
  <svg {...svgProps} className={`h-${size} w-${size} ${color} ${extraClasses}`}>
    <path stroke="none" d="M0 0h24v24H0z" />
    <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
    <path d="M7 12h14l-3 -3m0 6l3 -3" />
  </svg>
);

const MenuIcon = ({ size, color, extraClasses }) => (
  <svg {...svgProps} className={`h-${size} w-${size} ${color} ${extraClasses}`}>
    <path d="M4 6h16M4 12h8m-8 6h16" />
  </svg>
);

const AdjustmentsIcon = ({ size, color, extraClasses }) => (
  <svg {...svgProps} className={`h-${size} w-${size} ${color} ${extraClasses}`}>
    <path stroke="none" d="M0 0h24v24H0z" />
    <circle cx="14" cy="6" r="2" />
    <line x1="4" y1="6" x2="12" y2="6" />
    <line x1="16" y1="6" x2="20" y2="6" />
    <circle cx="8" cy="12" r="2" />
    <line x1="4" y1="12" x2="6" y2="12" />
    <line x1="10" y1="12" x2="20" y2="12" />
    <circle cx="17" cy="18" r="2" />
    <line x1="4" y1="18" x2="15" y2="18" />
    <line x1="19" y1="18" x2="20" y2="18" />
  </svg>
);

const UserIcon = ({ size, color, extraClasses }) => (
  <svg {...svgProps} className={`h-${size} w-${size} ${color} ${extraClasses}`}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const UserAddIcon = ({ size, color, extraClasses }) => (
  <svg {...svgProps} className={`h-${size} w-${size} ${color} ${extraClasses}`}>
    <path d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const HomeIcon = ({ size, color, extraClasses }) => (
  <svg {...svgProps} className={`h-${size} w-${size} ${color} ${extraClasses}`}>
    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ServicesIcon = ({ size, color, extraClasses }) => (
  <svg {...svgProps} className={`h-${size} w-${size} ${color} ${extraClasses}`}>
    <path stroke="none" d="M0 0h24v24H0z" />
    <path d="M15 4l6 2v5h-3v8a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1v-8h-3v-5l6 -2a3 3 0 0 0 6 0" />
  </svg>
);

const ContactIcon = ({ size, color, extraClasses }) => (
  <svg {...svgProps} className={`h-${size} w-${size} ${color} ${extraClasses}`}>
    <path stroke="none" d="M0 0h24v24H0z" />
    <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2" />
    <path d="M15 7a2 2 0 0 1 2 2" /> <path d="M15 3a6 6 0 0 1 6 6" />
  </svg>
);

const CartIcon = ({ size, color, extraClasses }) => (
  <svg {...svgProps} className={`h-${size} w-${size} ${color} ${extraClasses}`}>
    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const SendIcon = ({ size, color, extraClasses }) => (
  <svg {...svgProps} className={`h-${size} w-${size} ${color} ${extraClasses}`}>
    <path stroke="none" d="M0 0h24v24H0z" />
    <line x1="10" y1="14" x2="21" y2="3" />
    <path d="M21 3L14.5 21a.55 .55 0 0 1 -1 0L10 14L3 10.5a.55 .55 0 0 1 0 -1L21 3" />
  </svg>
);

const LoginIcon = ({ size, color, extraClasses }) => (
  <svg {...svgProps} className={`h-${size} w-${size} ${color} ${extraClasses}`}>
    <path stroke="none" d="M0 0h24v24H0z" />
    <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
    <path d="M20 12h-13l3 -3m0 6l-3 -3" />
  </svg>
);

const LinkIcon = ({ size, color, extraClasses }) => (
  <svg {...svgProps} className={`h-${size} w-${size} ${color} ${extraClasses}`}>
    <path stroke="none" d="M0 0h24v24H0z" />
    <path d="M11 7h-5a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-5" />
    <line x1="10" y1="14" x2="20" y2="4" /> <polyline points="15 4 20 4 20 9" />
  </svg>
);
const InfoIcon = ({ size, color, extraClasses }) => (
  <svg {...svgProps} className={`h-${size} w-${size} ${color} ${extraClasses}`}>
    <path stroke="none" d="M0 0h24v24H0z" /> <circle cx="12" cy="12" r="9" />{" "}
    <line x1="12" y1="8" x2="12.01" y2="8" />{" "}
    <polyline points="11 12 12 12 12 16 13 16" />
  </svg>
);
const TailorIcon = ({ size, color, extraClasses }) => (
  <svg {...svgProps} className={`h-${size} w-${size} ${color} ${extraClasses}`}>
    <path stroke="none" d="M0 0h24v24H0z" />
    <circle cx="8" cy="8" r="3" />
    <circle cx="16" cy="16" r="3" />
    <path d="M9.5 9.5L15 15" />
    <path d="M4 20l5-5M20 4l-5 5" />
  </svg>
);

const ThemeIcon = ({ size, color, extraClasses }) => (
  <svg {...svgProps} className={`h-${size} w-${size} ${color} ${extraClasses}`}>
    <path stroke="none" d="M0 0h24v24H0z" />{" "}
    <rect x="5" y="3" width="14" height="6" rx="2" />{" "}
    <path d="M19 6h1a2 2 0 0 1 2 2a5 5 0 0 1 -5 5l-5 0v2" />{" "}
    <rect x="10" y="15" width="4" height="6" rx="1" />
  </svg>
);

const AiIcon = ({ size, color, extraClasses }) => (
  <svg {...svgProps} className={`h-${size} w-${size} ${color} ${extraClasses}`}>
    <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const MeasurementIcon = ({ size, color, extraClasses }) => (
  <svg {...svgProps} className={`h-${size} w-${size} ${color} ${extraClasses}`}>
    <path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-1v3a1 1 0 1 1-2 0v-3h-1v3a1 1 0 1 1-2 0v-3h-1v3a1 1 0 1 1-2 0v-3H7a1 1 0 1 1 0-2h3v-1H7a1 1 0 1 1 0-2h3V8H7a1 1 0 0 1 0-2h3V5a2 2 0 0 0-2-2H5Z" />
  </svg>
);

export {
  EditIcon,
  SettingsIcon,
  LogoutIcon,
  MenuIcon,
  AdjustmentsIcon,
  UserIcon,
  UserAddIcon,
  HomeIcon,
  ServicesIcon,
  ContactIcon,
  CartIcon,
  SendIcon,
  LoginIcon,
  LinkIcon,
  InfoIcon,
  TailorIcon,
  ThemeIcon,
  AiIcon,
  MeasurementIcon,
};
