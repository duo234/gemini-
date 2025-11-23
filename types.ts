export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export enum MushroomType {
  NORMAL = 'NORMAL', // Red
  GOLDEN = 'GOLDEN', // Yellow
  POISON = 'POISON', // Purple
}

export interface Mushroom {
  id: string;
  x: number;
  y: number;
  type: MushroomType;
  points: number;
}

export interface GameStats {
  score: number;
  normalCount: number;
  goldenCount: number;
  poisonCount: number;
}
