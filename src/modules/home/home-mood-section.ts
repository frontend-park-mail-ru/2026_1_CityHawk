import { renderTemplate } from '../../app/templates/renderer.js';

export interface MoodCard {
  imageUrl?: string;
  title?: string;
  modifier?: string;
}

export interface HomeMoodSectionState {
  moodLeft?: MoodCard[];
  moodTall?: MoodCard;
}

export function renderHomeMoodSection(state: HomeMoodSectionState = {}): string {
  return renderTemplate('mood', {
    moodLeft: Array.isArray(state.moodLeft) ? state.moodLeft : [],
    moodTall: state.moodTall ?? {},
  });
}
