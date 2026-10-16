const adjectives = [
  "Brave",
  "Swift",
  "Mighty",
  "Silent",
  "Neon",
  "Sky",
  "Turbo",
  "Iron",
  "Wild",
  "Clever"
];

const nouns = [
  "Fox",
  "Rider",
  "Falcon",
  "Comet",
  "Panda",
  "Ninja",
  "Drifter",
  "Jumper",
  "Pilot",
  "Warden"
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

export function generateName(): string {
  return `${randomItem(adjectives)}${randomItem(nouns)}${Math.floor(100 + Math.random() * 900)}`;
}
