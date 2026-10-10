export function LanguageBar({ languages }: { languages: string[] }) {
  return (
    <section className="mkt-lang-bar" aria-label="Featured languages">
      <div className="mkt-wrap">
        <ul className="mkt-lang-list">
          {languages.map((name) => (
            <li key={name}>{name}</li>
          ))}
          <li aria-hidden="true">+</li>
        </ul>
      </div>
    </section>
  );
}
