// A basic blocklist to catch the most common slurs and hate terms in usernames.
// This is not exhaustive — it's a first line of defense, not a complete moderation system.
const BLOCKED_TERMS = [
  "nigger", "nigga", "chink", "spic", "kike", "faggot", "fag", "tranny",
  "retard", "coon", "gook", "wetback", "beaner", "paki", "raghead",
  "towelhead", "cracker", "honkey", "gypsy", "sandnigger", "nazi", "hitler",
];

function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[0-9]/g, (d) => ({ "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t" }[d] ?? d))
    .replace(/[^a-z]/g, "");
}

export function containsBlockedTerm(input: string): boolean {
  const normalized = normalize(input);
  return BLOCKED_TERMS.some((term) => normalized.includes(term));
}
