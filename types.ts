export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export enum MushroomType {
  NORMAL = 'NORMAL', // Red (Beat)
  GOLDEN = 'GOLDEN', // Yellow (Melody)
  POISON = 'POISON', // Purple (Obstacle)
}

export interface Mushroom {
  id: string;
  lane: -1 | 0 | 1; // Left, Center, Right
  z: number; // Depth distance from camera
  type: MushroomType;
  points: number;
}

export interface GameStats {
  score: number;
  normalCount: number;
  goldenCount: number;
  poisonCount: number;
  maxCombo: number;
}