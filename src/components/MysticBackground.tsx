/**
 * Purely decorative archive backdrop. It intentionally contains no canvas,
 * remote assets or runtime particle loop so it remains inexpensive and safe
 * when the test stays open for a long time.
 */
export function MysticBackground() {
  return (
    <div className="mystic-background" aria-hidden="true">
      <div className="mystic-background__veil" />
      <div className="mystic-background__nebula mystic-background__nebula--violet" />
      <div className="mystic-background__nebula mystic-background__nebula--cyan" />
      <div className="mystic-background__grid" />
      <div className="mystic-background__stars mystic-background__stars--far" />
      <div className="mystic-background__stars mystic-background__stars--near" />
      <div className="mystic-background__orbital">
        <span className="mystic-background__ring mystic-background__ring--outer" />
        <span className="mystic-background__ring mystic-background__ring--middle" />
        <span className="mystic-background__ring mystic-background__ring--inner" />
        <span className="mystic-background__axis" />
        <span className="mystic-background__core" />
      </div>
      <div className="mystic-background__vignette" />
      <div className="mystic-background__noise" />
    </div>
  );
}

export default MysticBackground;
