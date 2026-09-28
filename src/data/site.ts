export const profile = {
  name: "xXRenq",
  handle: "xXRenq",
  tagline: "Developer and modder building small, useful tools.",
  summary:
    "I build web tools, game modifications, and utilities in my spare time. This site collects what I've made and the places I'm active online.",
};

export type SocialLink = {
  id: string;
  label: string;
  href: string;
  icon: "github" | "steam" | "instagram" | "youtube";
  handle: string;
};

export const socialLinks: SocialLink[] = [
  {
    id: "github",
    label: "GitHub",
    href: "https://github.com/xXRenq",
    icon: "github",
    handle: "@xXRenq",
  },
  {
    id: "steam",
    label: "Steam",
    href: "https://steamcommunity.com/id/xxrenq/",
    icon: "steam",
    handle: "xxrenq",
  },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/siemaelopozdro69/",
    icon: "instagram",
    handle: "@siemaelopozdro69",
  },
  {
    id: "youtube",
    label: "YouTube",
    href: "https://www.youtube.com/@D4rkness-OG",
    icon: "youtube",
    handle: "@D4rkness-OG",
  },
];

export type Project = {
  id: string;
  name: string;
  description: string;
  href?: string;
  tags: string[];
};

export const projects: Project[] = [
  {
    id: "steam-points-converter",
    name: "Steam Points Converter",
    description:
      "A calculator for converting Steam Points to real currency and back, built with live exchange rates.",
    tags: ["Web", "Tool"],
  },
  {
    id: "xxrenq-site",
    name: "This Site",
    description:
      "A personal hub combining a link page, a growing set of tools, and project listings in one place.",
    href: "https://github.com/xXRenq",
    tags: ["Web", "React"],
  },
];

export type GameLink = {
  label: string;
  href: string;
};

export type GameEntry = {
  id: string;
  name: string;
  description: string;
  links: GameLink[];
  tags: string[];
};

export const games: GameEntry[] = [
  {
    id: "battlefield-4",
    name: "Battlefield 4",
    description: "Battlelog stats for my Battlefield 4 soldier.",
    links: [
      {
        label: "PS4 stats",
        href: "https://battlelog.battlefield.com/bf4/soldier/chodliwy-placek1/stats/1004366938354/ps4/",
      },
    ],
    tags: ["Multiplayer", "PS4"],
  },
  {
    id: "battlefield-3",
    name: "Battlefield 3",
    description: "Battlelog stats for my Battlefield 3 accounts.",
    links: [
      {
        label: "PS3 stats",
        href: "https://battlelog.battlefield.com/bf3/user/chodliwy_placek1/",
      },
      {
        label: "PC stats",
        href: "http://battlelog.battlefield.com/bf3/user/xxrenqq/",
      },
    ],
    tags: ["Multiplayer", "PS3", "PC"],
  },
  {
    id: "cs-source",
    name: "Counter-Strike: Source",
    description: "Modding and mapping work, including CSSO-related projects.",
    links: [],
    tags: ["Modding"],
  },
];

export const contact = {
  discordHandle: "xxrenq",
};
