export function getRandomGameHintFor(game: string): string {
  const allGameHints: Record<string, string[]> = {
    rust: [
      'Did you know we have a Rust game server? Join us on **rust.level9.gg**!',
    ],
  };

  const selectedGameHints = allGameHints[game?.trim().toLowerCase()];
  return selectedGameHints?.[
    Math.floor(Math.random() * selectedGameHints.length)
  ];
}

export function formatHint(hint: string): string {
  return `_**Hint:** ${hint}_`;
}
