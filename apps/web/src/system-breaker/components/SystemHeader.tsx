export function SystemHeader(props: { compact?: boolean; title?: string }) {
  return (
    <header className={`sb-header ${props.compact ? 'sb-header--compact' : ''}`}>
      <a className="sb-brand" href="/" aria-label="SYSTEM BREAKER 首頁">
        <span>SB//01</span>
        <strong>SYSTEM BREAKER</strong>
      </a>
      {props.title && <p>{props.title}</p>}
      <div>
        <span>DETERMINISTIC CORE</span>
        <b>ONLINE</b>
      </div>
    </header>
  );
}
