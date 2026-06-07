import { CalendarClock } from "lucide-react";

interface FixturesScreenProps {
  fixtures: Array<{ id: string; home: string; away: string; date: string; time: string; tag: string }>;
}

export function FixturesScreen({ fixtures }: FixturesScreenProps) {
  return (
    <section className="screen-stack">
      <div className="panel">
        <div className="panel-heading">
          <div>
            <p className="section-kicker">Your fixture radar</p>
            <h2>Next pressure points</h2>
          </div>
          <CalendarClock size={21} />
        </div>
        <div className="fixture-list">
          {fixtures.map((fixture) => (
            <article className="fixture-card" key={fixture.id}>
              <span className="fixture-date">
                <strong>{fixture.date}</strong>
                <small>{fixture.time}</small>
              </span>
              <span className="fixture-match">
                <strong>{fixture.home}</strong>
                <em>v</em>
                <strong>{fixture.away}</strong>
              </span>
              <span className="mini-badge">{fixture.tag}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
