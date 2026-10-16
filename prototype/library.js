// Independent crate rules. No Serato database or source files are modified.
export const ruleFields = {
  added: "Added (date)",
  album: "Album",
  artist: "Artist",
  bpm: "BPM",
  comment: "Comment",
  composer: "Composer",
  plays: "DJ Playcount",
  filename: "Filename",
  genre: "Genre",
  grouping: "Grouping",
  key: "Key",
  label: "Label",
  rating: "Rating",
  ratingEmoji: "Rating Emoji",
  remixer: "Remixer",
  title: "Song",
  whitelabel: "Whitelabel",
  year: "Year",
};
export const ruleOperators = [
  "contains",
  "is",
  "does not contain",
  "is not",
  "greater than",
  "less than",
  "at least",
  "at most",
];
export function matchesRule(track, rule) {
  const value =
    rule.field === "filename"
      ? track.file?.name || track.filename || track.title
      : track[rule.field];
  const a = String(value ?? "").toLocaleLowerCase();
  const b = String(rule.value ?? "").toLocaleLowerCase();
  if (rule.operator === "contains") return a.includes(b);
  if (rule.operator === "does not contain") return !a.includes(b);
  if (rule.operator === "is") return a === b;
  if (rule.operator === "is not") return a !== b;
  const x = rule.field === "added" ? Date.parse(a) : Number(a);
  const y = rule.field === "added" ? Date.parse(b) : Number(b);
  if (!a || !b || !Number.isFinite(x) || !Number.isFinite(y)) return false;
  return (
    {
      "greater than": x > y,
      "less than": x < y,
      "at least": x >= y,
      "at most": x <= y,
    }[rule.operator] ?? false
  );
}
export function smartMatches(crate, track) {
  const rules = crate.rules || [
    {
      field: crate.field || "bpm",
      operator: "at least",
      value: crate.value || "0",
    },
  ];
  return (
    rules.length > 0 &&
    (crate.match === "any"
      ? rules.some((r) => matchesRule(track, r))
      : rules.every((r) => matchesRule(track, r)))
  );
}
export function descendantIds(crates, id, seen = new Set()) {
  if (seen.has(id)) return seen;
  seen.add(id);
  for (const child of crates.filter((c) => c.parent === id))
    descendantIds(crates, child.id, seen);
  return seen;
}
export function crateMembers(crate, tracks, crates, includeChildren = false) {
  if (crate.smart)
    return crate.live === false && Array.isArray(crate.cached)
      ? tracks.filter((t) => crate.cached.includes(t.id))
      : tracks.filter((t) => smartMatches(crate, t));
  const members = new Set(crate.tracks);
  if (includeChildren) {
    for (const id of descendantIds(crates, crate.id)) {
      const child = crates.find((c) => c.id === id);
      if (child && !child.smart)
        for (const track of child.tracks) members.add(track);
    }
  }
  return tracks.filter((t) => members.has(t.id));
}
