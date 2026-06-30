import { useState, useEffect } from 'react';

export type Language = 'nl' | 'en';

const dictionaries: Record<Language, Record<string, string>> = {
    nl: {
        "Kaartstijl": "Kaartstijl",
        "Modern": "Modern",
        "Donker": "Donker",
        "Klassiek": "Klassiek",
        "Creative": "Neon",
        "HEARTS": "Harten",
        "DIAMONDS": "Ruiten",
        "CLUBS": "Klaveren",
        "SPADES": "Schoppen",
        "Achterkant": "Achterkant",
        "Stijl": "Stijl",
        "Volledig Deck Voorbeeld": "Volledig Deck Voorbeeld",
        "Dubbele kaarten in de piramide": "Dubbele kaarten in de piramide",
        "kaarten": "kaarten",
        "Kies een kaart per niveau": "Kies een kaart per niveau",
        "Kies een kaart per niveau voor dubbele slokken": "Kies een kaart per niveau voor dubbele slokken",
        "Niveau": "Niveau",
        "Matches op deze kaart tellen dubbel": "Matches op deze kaart tellen dubbel",
        "Deze kaart kan nog niet!": "Deze kaart kan nog niet!",
        "Stijl Wisselen": "Stijl Wisselen",
        "Kijk een korte video om direct over te schakelen naar de": "Kijk een korte video om direct over te schakelen naar de",
        "stijl!": "stijl!",
        "Thema Wisselen": "Thema Wisselen",
        "Kijk een korte video om direct over te schakelen naar het": "Kijk een korte video om direct over te schakelen naar het",
        "thema!": "thema!",
        "Video Kijken": "Video Kijken",
        "Nee bedankt": "Nee bedankt",
        "classic": "Klassiek",
        "metro": "Metro",
        "calm": "Rustig",
        "beer": "Bier",
        "De bus is gecrasht!": "De bus is gecrasht!",
        "Het spel is herstart om de fout op te lossen.": "Het spel is herstart om de fout op te lossen."
    },
    en: {
        "Bussen": "Ride the Bus",
        "Spelers": "Players",
        "Start met toevoegen": "Start adding",
        "START SPEL": "START GAME",
        "Instellingen": "Settings",
        "Piramide Hoogte": "Pyramid Height",
        "Bus Kaarten": "Bus Cards",
        "Bus Pakjes": "Bus Decks",
        "Gedeelde Bus": "Shared Bus",
        "Meer Instellingen": "More Settings",
        "Profielfoto kiezen": "Choose profile picture",
        "Maak foto": "Take photo",
        "Kies uit galerij": "Choose from gallery",
        "Annuleren": "Cancel",
        "Binnenkort beschikbaar...": "Coming soon...",
        "Nieuwe instellingen komen hier.": "New settings go here.",
        "Sluiten": "Close",
        "Kies je strijd": "Choose your battle",
        "Digitaal": "Digital",
        "Automatisch & Snel": "Automatic & Fast",
        "Fysiek": "Physical",
        "Met echte kaarten": "With real cards",
        "Terug": "Back",
        "Start": "Start",
        "Aan de beurt": "This player's turn",
        "Op": "Took",
        "Uit": "Gave",
        "kaarten": "cards",
        "Huidige Hand": "Current Hand",
        "Nog geen kaarten": "No cards yet",
        "Ronde": "Round",
        "Pak een kaart van de stapel...": "Draw a card from the deck...",
        "Volgende": "Next",
        "GOED": "RIGHT",
        "FOUT": "WRONG",
        "ROOD": "RED",
        "ZWART": "BLACK",
        "HOGER": "HIGHER",
        "LAGER": "LOWER",
        "GELIJK": "EQUAL",
        "BINNEN": "INSIDE",
        "BUITEN": "OUTSIDE",
        "ZELFDE": "SAME",
        "ANDERS": "DIFFERENT",
        "DISCO!": "DISCO!",
        "de bus in jij": "get in the bus",
        "Wie heeft nu de meeste kaarten?": "Who has the most cards now?",
        "To the Bus!": "To the Bus!",
        "een echte piramide": "a real pyramid",
        "Bouw deze piramide op tafel": "Build this pyramid on the table",
        "Bouw een Piramide starter guide": "Build a Pyramid starter guide",
        "Leg speelkaarten met het plaatje naar beneden in een piramidevorm (duh)": "Lay playing cards face down in a pyramid shape (duh)",
        "Start onderaan met": "Start at the bottom with",
        "kaarten in de breedste rij": "cards in the widest row",
        "Elke volgende rij heeft één kaart minder tot je een bovenste kaart hebt": "Each subsequent row has one card less until you have a top card",
        "Draai kaarten rij voor rij om, van onder naar boven": "Turn cards over row by row, from bottom to top",
        "Naar de Bus": "To the Bus",
        "Naar de Bus!": "To the Bus!",
        "Toch een Digitale Piramide": "Use a Digital Pyramid instead",
        "MATCH!": "MATCH!",
        "Wie legt op?": "Who drinks?",
        "Uitdelen:": "Distribute:",
        "Piramide": "Pyramid",
        "Draai kaarten om": "Turn cards over",
        "NAAR DE BUS": "TO THE BUS",
        ", Wie neem je mee de bus in?": ", Who goes into the bus with you?",
        "NIEMAND": "NOBODY",
        "Samen in de bus!": "Together in the bus!",
        "Fysieke bus": "Physical bus",
        "De Busrit": "The Bus Ride",
        "Passagier": "Passenger",
        "Passagiers": "Passengers",
        "Kaart": "Card",
        "Voortgang": "Progress",
        "De Busrit met echte Kaarten": "The Bus Ride with real Cards",
        "Kies iemand om de kaarten uit te delen, bijvoorbeeld": "Choose someone to deal the cards, e.g.",
        "jij": "you",
        "Leg een rij van": "Lay a row of",
        "kaarten met de afbeelding naar beneden.": "cards face down.",
        "Raad hoger of lager dan the vorige kaart, de eerste kaart is altijd omgedraaid.": "Guess higher or lower than the previous card; the first card is always turned.",
        "Fout? Drink het kaartnummer aan slokken en start opnieuw bij kaart één.": "Wrong? Drink sips equal to the card number and start again at card one.",
        "Goed? Ga door naar de volgende kaart.": "Right? Continue to the next card.",
        "Hele rij gehaald? Je mag uit de bus!": "Made it through the row? You can leave the bus!",
        "Correct": "Correct",
        "Incorrect": "Incorrect",
        "Toch een Digitale Bus": "Use a Digital Bus instead",
        "Naar het Einde": "To the End",
        "De Bus": "The Bus",
        "over": "remaining",
        "Pakje": "Deck",
        "Pakje leeg – pak een nieuw deck om verder te gaan": "Deck empty - grab a new deck to continue",
        "Kaarten van pakje zijn toegevoegd": "Cards of deck have been added",
        "Hoger": "Higher",
        "Lager": "Lower",
        "Uitslag": "Results",
        "Immuniteit": "Immunity",
        "Speler": "Player",
        "Slokken": "Sips",
        "Terug naar Menu": "Back to Menu",
        "Naam...": "Name...",
        "Spelers toevoegen": "Add players",
        "Nieuwe speler...": "New player...",
        "Voeg toe": "Add",
        "Start Spel": "Start Game",
        "Ronde 1: Rood of Zwart": "Round 1: Red or Black",
        "Hoger of Lager": "Higher or Lower",
        "Binnen of Buiten": "Inside or Outside",
        "Welke Kleur": "Which Suit",
        "De Piramide": "The Pyramid",
        "Spel Instellingen": "Game Settings",
        "Digitale Piramide": "Digital Pyramid",
        "Echte Kaarten": "Real Cards",
        "Deelvorm": "Share Form",
        "Iedereen eigen bus": "Everyone has their own bus",
        "Gezamenlijke bus": "Shared bus",
        "Piramide Rijen": "Pyramid Rows",
        "Bus Lengte": "Bus Length",
        "Aantal Stokken voor Bus": "Number of Decks for Bus",
        "Kies Afbeelding": "Choose Image",
        "Hoe wil je een foto toevoegen?": "How do you want to add a photo?",
        "Naam": "Name",
        "Kies wie in The Bus moet": "Choose who must enter the Bus",
        "Gedeelde Bus: De volgende mag": "Shared Bus: Next player's turn",
        "Iedereen in The Bus heeft het overleefd!": "Everyone survived The Bus!",
        "is de Bus uit ontsnapt!": "escaped the Bus!",
        "Jij mag beslissen wie in de bus gaat!": "You can decide who goes into the bus!",
        "De Piramide is klaar!": "The Pyramid is complete!",
        "Druk op 'Naar het Einde' om verder te gaan": "Press 'To the End' to continue",
        "Iedereen in de bus": "Everyone in the bus",
        "Zijn jullie klaar?": "Are you ready?",
        "Stap in": "Get in",
        "Oeps! Deze feature is in development": "Oops! This feature is in development",
        "Klaar om te beginnen?": "Ready to begin?",
        "Je zit in een gedeelde bus!": "You are in a shared bus!",
        "slokken": "sips",
        "slok": "sip",
        "uitdelen!": "give away!",
        "Niet gedronken door immuniteit": "Not drunk because of immunity",
        "Je mag een bus passagier kiezen": "You can choose a bus passenger",
        "Immuniteit kwijt door dubbele kaart": "Immunity lost because of double card",
        "Wat een eindbaas!": "What a boss!",
        "Drink ze": "Drink up",
        "Voeg spelers toe om te starten": "Add players to begin",
        "Je bent er bijna!": "You're almost there!",
        "De beruchte bus wacht...": "The notorious bus awaits...",
        "Wie zit de langste rit uit?": "Who will ride the longest?",
        "Alle stokken zijn op!": "All decks are empty!",
        "De busrit is voorbij, niemand heeft gewonnen...": "The bus ride is over, nobody won...",
        "Ritten": "Rides",
        "Gedronken": "Sips taken",
        "Leaderboard": "Leaderboard",
        "Rood of Zwart?": "Red or Black?",
        "Hoger of Lager?": "Higher or Lower?",
        "Binnen of Buiten?": "Inside or Outside?",
        "Hetzelfde Teken?": "Same Suit?",
        "Hetzelfde": "Same",
        "Anders": "Different",
        "ADTJE VOOR DE ZAAL!": "BOTTOMS UP!",
        "Wie heeft deze kaart?": "Who has this card?",
        "Taal / Language": "Language",
        "HARTEN": "HEARTS",
        "KLAVER": "CLUBS",
        "RUITEN": "DIAMONDS",
        "SCHOPPEN": "SPADES"
    }
};

const LANG_STORAGE_KEY = 'bus-app-language-v1';
const listeners = new Set<() => void>();

export const getDeviceLanguage = (): Language => {
    if (typeof navigator !== 'undefined') {
        const lang = navigator.language.toLowerCase();
        if (lang.startsWith('en')) return 'en';
    }
    return 'nl';
};

const getSavedLanguage = (): Language => {
    try {
        const saved = localStorage.getItem(LANG_STORAGE_KEY) as Language;
        if (saved === 'nl' || saved === 'en') return saved;
    } catch (e) { }
    return getDeviceLanguage();
};

export let currentLanguage: Language = getSavedLanguage();

export const setLanguage = (lang: Language) => {
    if (lang === currentLanguage) return;
    currentLanguage = lang;
    try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (e) { }
    listeners.forEach(l => l());
};

export const useTranslation = () => {
    const [lang, setLang] = useState<Language>(currentLanguage);

    useEffect(() => {
        const handleChange = () => setLang(currentLanguage);
        listeners.add(handleChange);
        return () => {
            listeners.delete(handleChange);
        };
    }, []);

    const t = (text: any): any => {
        if (!text) return text;
        if (typeof text !== 'string') return text;
        const trimmed = text.trim();
        if (lang === 'nl') {
            return dictionaries.nl[text] || dictionaries.nl[trimmed] || text;
        }
        return dictionaries.en[text] || dictionaries.en[trimmed] || text;
    };

    return { t, lang, setLanguage, currentLanguage };
};