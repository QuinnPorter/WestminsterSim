import './TitleScreen.css';

export function TitleScreen({ onNewCareer }: { onNewCareer: () => void }) {
  return (
    <div className="screen title-screen">
      <div className="title-crest">
        {/* a friendly portcullis-ish mark */}
        <svg viewBox="0 0 80 80" width="92" height="92">
          <rect x="14" y="18" width="52" height="44" rx="8" fill="#33415C" />
          <rect x="22" y="10" width="6" height="14" rx="3" fill="#33415C" />
          <rect x="37" y="6" width="6" height="18" rx="3" fill="#33415C" />
          <rect x="52" y="10" width="6" height="14" rx="3" fill="#33415C" />
          <rect x="22" y="28" width="36" height="4" rx="2" fill="#FAF7F1" />
          <rect x="22" y="38" width="36" height="4" rx="2" fill="#FAF7F1" />
          <rect x="22" y="48" width="36" height="4" rx="2" fill="#FAF7F1" />
          <rect x="30" y="24" width="4" height="32" rx="2" fill="#FAF7F1" />
          <rect x="46" y="24" width="4" height="32" rx="2" fill="#FAF7F1" />
        </svg>
      </div>
      <h1 className="title-name">WestminsterSim</h1>
      <p className="title-tag">
        One seat. Five stats. Six hundred and forty-nine colleagues in your way.
      </p>
      <button className="btn btn-primary title-start" onClick={onNewCareer}>
        Begin your career
      </button>
      <p className="title-foot">A political life simulator · entirely fictional MPs</p>
    </div>
  );
}
