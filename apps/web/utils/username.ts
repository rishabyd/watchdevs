import { prisma } from "@repo/db";

const adjectives = [
  "swift",
  "bold",
  "happy",
  "clever",
  "bright",
  "calm",
  "crisp",
  "eager",
  "fresh",
  "grand",
  "kind",
  "keen",
  "nimble",
  "quiet",
  "rare",
  "smart",
  "swift",
  "vital",
  "witty",
  "zealous",
  "agile",
  "brisk",
  "cosmic",
  "daring",
  "elite",
  "fluid",
  "glorious",
  "heroic",
  "iconic",
  "jolly",
  "keen",
  "lively",
];

const nouns = [
  "panda",
  "eagle",
  "tiger",
  "wolf",
  "fox",
  "bear",
  "lion",
  "hawk",
  "phoenix",
  "dragon",
  "raven",
  "falcon",
  "shark",
  "cobra",
  "viper",
  "puma",
  "lynx",
  "otter",
  "mink",
  "stoat",
  "weasel",
  "badger",
  "tern",
  "kite",
  "heron",
  "stork",
  "crane",
  "albatross",
  "petrel",
  "skua",
  "penguin",
];

export async function generateRandomUsername(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 9999);

    const username = `${adj}${noun}${num}`;

    // Check if username already exists
    const existing = await prisma.user.findUnique({
      where: { profileUsername: username },
    });

    if (!existing) {
      return username;
    }

    attempts++;
  }

  // Fallback: use timestamp + random if we exhaust attempts
  return `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}
