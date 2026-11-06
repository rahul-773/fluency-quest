export interface QuizQuestion {
  prompt: string;
  choices: string[];
  answer: number;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    prompt: 'Choose the past simple form of "write".',
    choices: ['writed', 'wrote', 'written', 'writing'],
    answer: 1,
  },
  {
    prompt: 'Which is a correct article usage?',
    choices: ['a hour', 'an hour', 'a honest', 'an university'],
    answer: 1,
  },
  {
    prompt: 'Pick the correct comparative form.',
    choices: ['more good', 'gooder', 'better', 'best'],
    answer: 2,
  },
  {
    prompt: 'Complete: "She ___ in London since 2019."',
    choices: ['lives', 'has lived', 'lived', 'is living'],
    answer: 1,
  },
  {
    prompt: 'Which sentence is conditional (Type 2)?',
    choices: [
      'If it rains, I will stay home.',
      'If I were rich, I would travel.',
      'If you heat ice, it melts.',
      'If she had called, I would have answered.',
    ],
    answer: 1,
  },
  {
    prompt: 'Pick the correct preposition: "He is afraid ___ spiders."',
    choices: ['from', 'of', 'about', 'with'],
    answer: 1,
  },
  {
    prompt: 'Choose the correct modal: "You ___ smoke here."',
    choices: ['must not', 'do not must', 'musts not', 'not must'],
    answer: 0,
  },
  {
    prompt: 'Which is the correct tag question? "You are coming, ___?"',
    choices: ['are you', "aren't you", 'do you', "don't you"],
    answer: 1,
  },
  {
    prompt: 'Pick the sentence using the present perfect continuous.',
    choices: [
      'I have worked all day.',
      'I have been working all day.',
      'I am working all day.',
      'I had worked all day.',
    ],
    answer: 1,
  },
  {
    prompt: 'Which sentence uses reported speech correctly?',
    choices: [
      'She said she is tired.',
      'She said she was tired.',
      'She said she tired.',
      'She told she is tired.',
    ],
    answer: 1,
  },
  {
    prompt: 'Choose the correct phrasal verb: "Please ___ the lights."',
    choices: ['turn off', 'turn of', 'off turn', 'turn out off'],
    answer: 0,
  },
  {
    prompt: 'Pick the correct relative pronoun: "The book ___ I read was great."',
    choices: ['who', 'which', 'whose', 'when'],
    answer: 1,
  },
];
