import { renderTemplate } from '../../app/templates/renderer.js';

export interface MoodCard {
  imageUrl?: string;
  title?: string;
  modifier?: string;
  href?: string;
}

export interface HomeMoodSectionState {
  moodLeft?: MoodCard[];
  moodRight?: MoodCard[];
}

export function renderHomeMoodSection(state: HomeMoodSectionState = {}): string {
  return renderTemplate('mood', {
    moodLeft: Array.isArray(state.moodLeft) ? state.moodLeft.slice(0, 3) : [],
    moodRight: Array.isArray(state.moodRight) ? state.moodRight.slice(0, 2) : [],
  });
}
