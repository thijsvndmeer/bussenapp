import { DEFAULT_LOCALE } from "./locale";
import type { Device, ProjectState, Slide } from "./types";

let _id = 0;
export const nid = () => `s_${Date.now().toString(36)}_${(_id++).toString(36)}`;

const en = (s: string) => ({ [DEFAULT_LOCALE]: s });

function makeBussenSlides(): Slide[] {
  return [
    {
      id: nid(),
      layout: "hero",
      label: en("BUSSEN COMPANION"),
      headline: en("Klaar voor de start?\nVoeg spelers toe!"),
      screenshot: "/screenshots/apple/iphone/en/01.png",
    },
    {
      id: nid(),
      layout: "two-devices",
      label: en("KAARTEN GISSEN"),
      headline: en("Rood of zwart?\nHoger of lager?"),
      screenshot: "/screenshots/apple/iphone/en/03.png",
      screenshotSecondary: "/screenshots/apple/iphone/en/02.png",
    },
    {
      id: nid(),
      layout: "two-devices",
      label: en("DISCO MODUS"),
      headline: en("Heb je drie symbolen?\nStart de Disco!"),
      screenshot: "/screenshots/apple/iphone/en/04_disco.png",
      screenshotSecondary: "/screenshots/apple/iphone/en/04.png",
    },
    {
      id: nid(),
      layout: "device-top",
      label: en("DE PIRAMIDE"),
      headline: en("Draai kaarten om\nen deel slokken uit!"),
      screenshot: "/screenshots/apple/iphone/en/05.png",
    },
    {
      id: nid(),
      layout: "device-bottom",
      label: en("DE BUSRIT"),
      headline: en("De beruchte busrit\nwacht op de verliezer!"),
      screenshot: "/screenshots/apple/iphone/en/06.png",
      inverted: true,
    },
    {
      id: nid(),
      layout: "hero",
      label: en("LEADERBOARD"),
      headline: en("Wie drinkt het meest?\nBekijk de uitslag!"),
      screenshot: "/screenshots/apple/iphone/en/07.png",
    },
  ];
}

function ipadStarter(): Slide[] {
  return [
    {
      id: nid(),
      layout: "hero",
      label: en("MEET YOUR APP"),
      headline: en("Made for\nthe big screen."),
      screenshot: "",
    },
    {
      id: nid(),
      layout: "device-bottom",
      label: en("FEATURE 01"),
      headline: en("Built for\nfocus."),
      screenshot: "",
    },
    {
      id: nid(),
      layout: "device-top",
      label: en("FEATURE 02"),
      headline: en("Always within reach."),
      screenshot: "",
      inverted: true,
    },
  ];
}

function tabletStarter(kind: "7" | "10"): Slide[] {
  return [
    {
      id: nid(),
      layout: "hero",
      label: en("MEET YOUR APP"),
      headline: en(kind === "7" ? "Pocket-sized\npower." : "Made for\nthe big screen."),
      screenshot: "",
    },
    {
      id: nid(),
      layout: "split-landscape",
      label: en("FEATURE 01"),
      headline: en("Wide canvas,\nbigger ideas."),
      screenshot: "",
    },
  ];
}

function fgStarter(): Slide[] {
  return [
    {
      id: nid(),
      layout: "feature-graphic",
      label: {},
      headline: en("De ultieme Bussen drinkspel metgezel!"),
      screenshot: "",
    },
  ];
}

export const DEFAULT_PROJECT: ProjectState = {
  appName: "Bussen",
  themeId: "dark-bold",
  locales: [DEFAULT_LOCALE],
  locale: DEFAULT_LOCALE,
  device: "iphone",
  orientation: "portrait",
  appIcon: "/app-icon.png",
  slidesByDevice: {
    iphone: makeBussenSlides(),
    android: makeBussenSlides(),
    ipad: ipadStarter(),
    "android-7": tabletStarter("7"),
    "android-10": tabletStarter("10"),
    "feature-graphic": fgStarter(),
  },
};

export function newSlide(layout: Slide["layout"] = "device-bottom"): Slide {
  return {
    id: nid(),
    layout,
    label: en("NEW"),
    headline: en("Edit this\nheadline."),
    screenshot: "",
  };
}

export function detectPlatform(device: Device): "ios" | "android" {
  return device === "iphone" || device === "ipad" ? "ios" : "android";
}
