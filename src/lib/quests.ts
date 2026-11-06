import type { IconType } from '@/lib/types';

export type RegionId = 'woods' | 'metro' | 'spires';

export interface QuestQuestion {
  prompt: string;
  choices: string[];
  answer: number; // index
  explain: string;
}

export interface Quest {
  id: string;
  title: string;
  blurb: string;
  xp: number;
  questions: QuestQuestion[];
}

export interface Region {
  id: RegionId;
  name: string;
  tagline: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  accent: 'green' | 'amber' | 'pink';
  icon: IconType;
  // position on the stylized map (percent)
  pos: { x: number; y: number };
  quests: Quest[];
}

export const REGIONS: Region[] = [
  {
    id: 'woods',
    name: 'Whispering Woods',
    tagline: 'Gentle trails of vocabulary and tense',
    difficulty: 'Beginner',
    accent: 'green',
    icon: 'Trees',
    pos: { x: 16, y: 62 },
    quests: [
      {
        id: 'w1',
        title: 'The Clearing of Tenses',
        blurb: 'A shy spirit asks you about yesterday and tomorrow.',
        xp: 50,
        questions: [
          {
            prompt: 'Choose the correct sentence.',
            choices: [
              'Yesterday I go to the river.',
              'Yesterday I went to the river.',
              'Yesterday I going to the river.',
              'Yesterday I gone to the river.',
            ],
            answer: 1,
            explain: 'Use the simple past ("went") for a completed action at a specific past time.',
          },
          {
            prompt: 'Which word correctly fills the blank? "She ___ never seen the fireflies."',
            choices: ['has', 'have', 'is', 'did'],
            answer: 0,
            explain: 'Present perfect with "she" uses "has" + past participle "seen".',
          },
          {
            prompt: 'Pick the sentence using the future continuous tense.',
            choices: [
              'I will study the map.',
              'I will be studying the map at noon.',
              'I studied the map.',
              'I have been studying the map.',
            ],
            answer: 1,
            explain: 'Future continuous = "will be" + verb-ing, describing an action in progress later.',
          },
        ],
      },
      {
        id: 'w2',
        title: 'The Mossy Lexicon',
        blurb: 'Match forest words to their meanings.',
        xp: 50,
        questions: [
          {
            prompt: 'What does "canopy" most likely mean?',
            choices: ['A type of mushroom', 'The upper layer of forest cover', 'A small stream', 'A wooden bridge'],
            answer: 1,
            explain: '"Canopy" is the leafy upper layer formed by tree branches.',
          },
          {
            prompt: 'Choose the best synonym for "whisper".',
            choices: ['shout', 'murmur', 'laugh', 'whistle'],
            answer: 1,
            explain: 'To "murmur" is to speak very softly, like a whisper.',
          },
          {
            prompt: 'Complete: "The path was ___ by fallen leaves."',
            choices: ['hiding', 'hidden', 'hides', 'hide'],
            answer: 1,
            explain: 'Passive voice past participle: "was hidden by".',
          },
        ],
      },
      {
        id: 'w3',
        title: "The Owl's Riddle",
        blurb: 'Solve the grammar riddle to wake the guardian.',
        xp: 50,
        questions: [
          {
            prompt: 'Which sentence is in the passive voice?',
            choices: [
              'The owl caught the mouse.',
              'The mouse was caught by the owl.',
              'The owl is catching the mouse.',
              'The owl has caught the mouse.',
            ],
            answer: 1,
            explain: 'Passive voice focuses on the receiver: "was caught by".',
          },
          {
            prompt: 'Pick the correct article: "I saw ___ owl and ___ acorn."',
            choices: ['a / a', 'an / an', 'an / a', 'a / an'],
            answer: 2,
            explain: '"owl" starts with a vowel sound (an); "acorn" starts with a consonant sound (a).',
          },
          {
            prompt: 'Which sentence uses the correct preposition?',
            choices: [
              'We walked through the forest at midnight.',
              'We walked through the forest in midnight.',
              'We walked through the forest on midnight.',
              'We walked through the forest of midnight.',
            ],
            answer: 0,
            explain: '"At" a specific time like midnight; "in" is for longer periods.',
          },
        ],
      },
    ],
  },
  {
    id: 'metro',
    name: 'Neon Metropolis',
    tagline: 'Fast talk and city-smart idioms',
    difficulty: 'Intermediate',
    accent: 'amber',
    icon: 'Building2',
    pos: { x: 52, y: 38 },
    quests: [
      {
        id: 'm1',
        title: 'Subway Small Talk',
        blurb: 'Order coffee, ask directions, and chat with commuters.',
        xp: 50,
        questions: [
          {
            prompt: 'Choose the most natural response to "How is it going?"',
            choices: ['It is proceeding adequately.', "Not bad — a little tired.", 'Negative.', 'I am fine thank you and you.'],
            answer: 1,
            explain: 'Casual small talk uses relaxed phrasing like "Not bad — a little tired."',
          },
          {
            prompt: 'What does "I am swamped" most likely mean?',
            choices: ['I am in a swamp.', 'I am very busy.', 'I am sick.', 'I am bored.'],
            answer: 1,
            explain: '"Swamped" is an idiom for being overwhelmed with work.',
          },
          {
            prompt: 'Pick the polite request form.',
            choices: ['Give me a coffee.', 'Could I get a coffee, please?', 'I want coffee now.', 'Coffee me.'],
            answer: 1,
            explain: '"Could I get ..., please?" is polite and natural for ordering.',
          },
        ],
      },
      {
        id: 'm2',
        title: 'The Advert Director',
        blurb: 'Trim wordy ads into sharp, clear copy.',
        xp: 50,
        questions: [
          {
            prompt: 'Which sentence is the most concise?',
            choices: [
              'Due to the fact that it is raining, the event is canceled.',
              'Because it is raining, the event is canceled.',
              'Owing to the fact that rain is falling, the event is canceled.',
              'The reason the event is canceled is because of rain falling.',
            ],
            answer: 1,
            explain: 'Replace "due to the fact that" with "because" for concise writing.',
          },
          {
            prompt: 'Choose the sentence with active voice.',
            choices: [
              'The slogan was written by our team.',
              'Our team wrote the slogan.',
              'The slogan has been written.',
              'By our team the slogan was written.',
            ],
            answer: 1,
            explain: 'Active voice places the doer first: "Our team wrote the slogan."',
          },
          {
            prompt: 'Pick the correct comparative.',
            choices: ['more sharper', 'sharper', 'more sharp', 'most sharp'],
            answer: 1,
            explain: 'One-syllable adjectives form comparatives with "-er": sharper.',
          },
        ],
      },
      {
        id: 'm3',
        title: 'Night Market Negotiation',
        blurb: 'Haggle politely with the neon-lit vendor.',
        xp: 50,
        questions: [
          {
            prompt: 'Which phrase softens a refusal politely?',
            choices: ['No way.', "I am afraid that is a bit high for me.", 'Never.', 'Wrong price.'],
            answer: 1,
            explain: '"I am afraid ..." softens disagreement in negotiation.',
          },
          {
            prompt: 'Complete: "If I ___ a member, I would get a discount."',
            choices: ['am', 'was', 'were', 'be'],
            answer: 2,
            explain: 'Second conditional uses "were" for hypothetical situations.',
          },
          {
            prompt: 'What does "Let me sleep on it" imply?',
            choices: ['I will decide tomorrow.', 'I am sleepy.', 'It is free.', 'I refuse.'],
            answer: 0,
            explain: '"Sleep on it" means to delay a decision until after thinking overnight.',
          },
        ],
      },
    ],
  },
  {
    id: 'spires',
    name: 'Academy of Spires',
    tagline: 'Advanced grammar and academic tone',
    difficulty: 'Advanced',
    accent: 'pink',
    icon: 'Landmark',
    pos: { x: 84, y: 26 },
    quests: [
      {
        id: 's1',
        title: 'The Thesis Gate',
        blurb: 'Construct a flawless academic paragraph.',
        xp: 50,
        questions: [
          {
            prompt: 'Which sentence is most formal and academic?',
            choices: [
              'The results are kinda mixed.',
              'The findings present a mixed picture.',
              'The results are all over the place.',
              'It is a mess basically.',
            ],
            answer: 1,
            explain: 'Academic tone uses precise nouns and avoids informal hedges.',
          },
          {
            prompt: 'Pick the sentence with correct subject-verb agreement.',
            choices: [
              'The data shows a clear trend.',
              'The data show a clear trend.',
              'The data showing a clear trend.',
              'The data shown a clear trend.',
            ],
            answer: 1,
            explain: '"Data" is plural; the singular is "datum", so "data show" is correct.',
          },
          {
            prompt: 'Choose the best transition to contrast ideas.',
            choices: ['Furthermore', 'However', 'Similarly', 'In addition'],
            answer: 1,
            explain: '"However" signals contrast between two ideas.',
          },
        ],
      },
      {
        id: 's2',
        title: 'The Conditional Tower',
        blurb: 'Master the third conditional and inversion.',
        xp: 50,
        questions: [
          {
            prompt: 'Complete the third conditional: "If she ___ earlier, she ___ the train."',
            choices: [
              'left / would catch',
              'had left / would have caught',
              'leaves / will catch',
              'would leave / caught',
            ],
            answer: 1,
            explain: 'Third conditional: if + past perfect, would have + past participle.',
          },
          {
            prompt: 'Which sentence uses inversion correctly?',
            choices: [
              'Never I have seen such a tower.',
              'Never have I seen such a tower.',
              'Never seen I have such a tower.',
              'I have seen never such a tower.',
            ],
            answer: 1,
            explain: 'Negative adverbials invert the auxiliary: "Never have I ...".',
          },
          {
            prompt: 'Pick the correct wish form.',
            choices: [
              'I wish I am taller.',
              'I wish I were taller.',
              'I wish I will be taller.',
              'I wish I can be taller.',
            ],
            answer: 1,
            explain: 'Wishes about the present use the past subjunctive "were".',
          },
        ],
      },
      {
        id: 's3',
        title: 'The Debate Chamber',
        blurb: 'Sharpen argumentative linking and emphasis.',
        xp: 50,
        questions: [
          {
            prompt: 'Choose the phrase that adds emphasis.',
            choices: ['By the way', 'It is worth noting that', 'Anyway', 'So-called'],
            answer: 1,
            explain: '"It is worth noting that" emphasizes an important point.',
          },
          {
            prompt: 'Which is a logical concession?',
            choices: [
              'Therefore, we agree.',
              'Admittedly, the cost is high, but ...',
              'In short, yes.',
              'Obviously not.',
            ],
            answer: 1,
            explain: '"Admittedly" concedes a point before rebutting it.',
          },
          {
            prompt: 'Pick the sentence with a correct cleft structure.',
            choices: [
              'It is the conclusion that matters most.',
              'The conclusion it is matters most.',
              'Is the conclusion that matters most.',
              'It matters the conclusion most.',
            ],
            answer: 0,
            explain: 'It-cleft: "It is X that ..." to emphasize X.',
          },
        ],
      },
    ],
  },
];

export function findRegion(id: RegionId): Region {
  const r = REGIONS.find((x) => x.id === id);
  if (!r) throw new Error('Unknown region: ' + id);
  return r;
}

export function findQuest(regionId: RegionId, questId: string): { region: Region; quest: Quest } {
  const region = findRegion(regionId);
  const quest = region.quests.find((q) => q.id === questId);
  if (!quest) throw new Error('Unknown quest: ' + questId);
  return { region, quest };
}

export function allQuests(): { region: Region; quest: Quest }[] {
  return REGIONS.flatMap((region) => region.quests.map((quest) => ({ region, quest })));
}
