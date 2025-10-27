import { OPTION_LETTERS } from './constants';

export function getLetterFromNumber(num: number): string {
  return String.fromCharCode(64 + num);
}

export function getAnswerBubbleStyle(letter: string): string {
  switch (letter.toUpperCase()) {
    case 'A': return 'bg-blue-500';
    case 'B': return 'bg-green-500';
    case 'C': return 'bg-yellow-500';
    case 'D': return 'bg-purple-500';
    case 'E': return 'bg-pink-500';
    case 'F': return 'bg-indigo-500';
    case 'G': return 'bg-red-500';
    case 'H': return 'bg-orange-500';
    default: return 'bg-gray-400';
  }
}

export function getNumberFromLetter(letter: string): number {
  return OPTION_LETTERS.indexOf(letter.toUpperCase()) + 1;
}
