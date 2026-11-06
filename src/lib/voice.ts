import type { RegionId } from '@/lib/quests';

export interface VoiceTarget {
  word: string;
  hint: string;
}

export interface VoiceLine {
  speaker: 'npc' | 'user-target';
  // what the NPC says (npc) or what the user should try to say (user-target)
  text: string;
  // words to highlight / look for in transcription
  targets: VoiceTarget[];
}

export interface Scenario {
  id: string;
  title: string;
  region: RegionId;
  npcName: string;
  npcRole: string;
  emoji: string;
  accent: 'green' | 'amber' | 'pink';
  greeting: string;
  lines: VoiceLine[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'cafe-order',
    title: 'Ordering at a Forest Cafe',
    region: 'woods',
    npcName: 'Pine',
    npcRole: 'Friendly barista',
    emoji: '🌲',
    accent: 'green',
    greeting: 'Welcome, traveler! What can I get for you today?',
    lines: [
      {
        speaker: 'npc',
        text: "Welcome, traveler! What can I get for you today?",
        targets: [{ word: 'welcome', hint: 'Greeting' }, { word: 'today', hint: 'Time' }],
      },
      {
        speaker: 'user-target',
        text: "I would like a black coffee, please.",
        targets: [
          { word: 'would', hint: 'Polite modal' },
          { word: 'like', hint: 'Request verb' },
          { word: 'please', hint: 'Politeness' },
        ],
      },
      {
        speaker: 'npc',
        text: "Great choice. Would you like anything to eat with that?",
        targets: [{ word: 'anything', hint: 'Question word' }],
      },
      {
        speaker: 'user-target',
        text: "Yes, I will have a croissant, thank you.",
        targets: [
          { word: 'will', hint: 'Future modal' },
          { word: 'have', hint: 'Choice verb' },
          { word: 'thank', hint: 'Courtesy' },
        ],
      },
      {
        speaker: 'npc',
        text: "Wonderful. That will be four gems. Enjoy your meal!",
        targets: [{ word: 'enjoy', hint: 'Closing verb' }],
      },
    ],
  },
  {
    id: 'metro-taxi',
    title: 'Catching a Neon Taxi',
    region: 'metro',
    npcName: 'Volt',
    npcRole: 'City cab driver',
    emoji: '🚕',
    accent: 'amber',
    greeting: "Hop in! Where are we headed tonight?",
    lines: [
      {
        speaker: 'npc',
        text: "Hop in! Where are we headed tonight?",
        targets: [{ word: 'tonight', hint: 'Time' }],
      },
      {
        speaker: 'user-target',
        text: "Please take me to the central station.",
        targets: [
          { word: 'please', hint: 'Politeness' },
          { word: 'take', hint: 'Direction verb' },
          { word: 'station', hint: 'Destination' },
        ],
      },
      {
        speaker: 'npc',
        text: "Sure thing. Do you know the fastest route is closed tonight?",
        targets: [{ word: 'fastest', hint: 'Superlative' }],
      },
      {
        speaker: 'user-target',
        text: "No problem, I am not in a hurry.",
        targets: [
          { word: 'problem', hint: 'Reassurance' },
          { word: 'hurry', hint: 'Time pressure' },
        ],
      },
      {
        speaker: 'npc',
        text: "Relax and enjoy the ride. We will be there in ten minutes.",
        targets: [{ word: 'minutes', hint: 'Duration' }],
      },
    ],
  },
  {
    id: 'academy-interview',
    title: 'The Academy Interview',
    region: 'spires',
    npcName: 'Dean Mira',
    npcRole: 'Admissions dean',
    emoji: '🎓',
    accent: 'pink',
    greeting: "Good day. Tell me, why do you wish to study here?",
    lines: [
      {
        speaker: 'npc',
        text: "Good day. Tell me, why do you wish to study here?",
        targets: [{ word: 'wish', hint: 'Question verb' }],
      },
      {
        speaker: 'user-target',
        text: "I wish to study here because the program is excellent.",
        targets: [
          { word: 'wish', hint: 'Formal want' },
          { word: 'because', hint: 'Reason link' },
          { word: 'excellent', hint: 'Adjective' },
        ],
      },
      {
        speaker: 'npc',
        text: "Indeed. What are your long-term goals?",
        targets: [{ word: 'goals', hint: 'Future noun' }],
      },
      {
        speaker: 'user-target',
        text: "My goal is to become a translator and a teacher.",
        targets: [
          { word: 'goal', hint: 'Aim noun' },
          { word: 'become', hint: 'Change verb' },
          { word: 'teacher', hint: 'Profession' },
        ],
      },
      {
        speaker: 'npc',
        text: "An admirable ambition. Welcome to the Academy of Spires.",
        targets: [{ word: 'admirable', hint: 'Praise adjective' }],
      },
    ],
  },
];

export function getScenario(id: string): Scenario {
  const s = SCENARIOS.find((x) => x.id === id);
  if (!s) throw new Error('Unknown scenario: ' + id);
  return s;
}
