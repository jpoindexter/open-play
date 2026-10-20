// Transport ownership, independent of which deck's SYNC button was pressed.
export function createSyncMaster({decks}) {
  const starts = new WeakMap();
  let sequence = 0, chosen = null;
  const loaded = () => decks().filter(d => d.track);
  const order = d => starts.get(d)?.track === d.track ? starts.get(d).order : Infinity;
  function master() {
    const all = loaded();
    if (chosen && all.includes(chosen.deck) && chosen.deck.track === chosen.track) return chosen.deck;
    chosen = null;
    const playing = all.filter(d => d.playing).sort((a,b) => order(a)-order(b) || a.index-b.index);
    return playing[0] || all.find(d => d.sync && d.syncRole === 'primary') || all[0] || null;
  }
  return {
    master,
    started(deck) { starts.set(deck, {track:deck.track, order:++sequence}); },
    select(deck) { chosen = deck?.track ? {deck,track:deck.track} : null; },
    manual: () => !!chosen,
    plan(clicked) {
      const leader = master(), others = loaded().filter(d => d !== leader);
      const follower = clicked !== leader ? clicked : others.find(d => d.index === (leader.index ^ 1)) || others[0];
      if (!leader || !follower?.track) throw new Error('Load a track on another deck before using Sync.');
      return {leader, follower};
    }
  };
}
