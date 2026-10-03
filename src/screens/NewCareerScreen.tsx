import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArenaId, AvatarConfig, BackgroundId, CauseId, DevolvedArenaId, Era, Gender, PartyId, RegionId,
} from '../types/game';
import { useGameStore } from '../store/gameStore';
import { useUiStore } from '../store/uiStore';
import { CauseGrid, toggleCause as toggleCauseList, MAX_CAUSES } from '../components/CauseGrid';
import { PARTIES, partyNameIn, playablePartiesForEra, populistPartyForEra } from '../data/parties';
import { PLAYER_REGIONS, REGIONS } from '../data/regions';
import { BACKGROUND_IDS, BACKGROUNDS } from '../data/backgrounds';
import { PARLIAMENTS } from '../data/parliaments';
import { CHAMBERS, DEVOLVED_ARENAS, chamberAt, houseHeading } from '../data/chambers';
import { DEVOLVED_LEGISLATURES } from '../data/devolved';
import { formatFull, isoToDay } from '../engine/clock';
import { Avatar } from '../avatar/Avatar';
import { SwipeCarousel } from '../components/SwipeCarousel';
import { AVATAR_COUNTS, AvatarLayerKey } from '../avatar/palette';
import { Rng } from '../engine/rng';
import { randomAvatar, generateName } from '../generation/characters';
import './NewCareerScreen.css';

const FULL_STEPS = ['Chamber', 'Era', 'You', 'Party', 'Background', 'Agenda', 'Look'] as const;
// continuing as a protégé locks the chamber, era and party (same world), so those steps drop
const PROTEGE_STEPS = ['You', 'Background', 'Agenda', 'Look'] as const;
type StepName = (typeof FULL_STEPS)[number];

const ERA_LABELS: Record<Era, { title: string; blurb: string }> = {
  '2010': {
    title: 'May 2010',
    blurb: 'A hung parliament after the financial crash, and a Conservative–Liberal Democrat coalition takes office. Austerity is coming, the deficit dominates, and the two governing parties are already pulling in different directions.',
  },
  '2015': {
    title: 'May 2015',
    blurb: 'A surprise Conservative majority of 12. Austerity, an EU referendum pledge to keep, UKIP snapping at the right, and the SNP sweeping all but three Scottish seats.',
  },
  '2017': {
    title: 'June 2017',
    blurb: 'The Conservative election gamble backfires: a hung parliament, propped up by the DUP. Brexit consumes everything and the majority has vanished.',
  },
  '2019': {
    title: 'December 2019',
    blurb: 'A thumping Conservative majority of 80. Brexit looms, the red wall has crumbled, and you are one of the new intake.',
  },
  '2024': {
    title: 'July 2024',
    blurb: 'A Labour landslide of 411 seats. A weary country wants delivery, and you have just been handed a green bench to sit on.',
  },
};

/** what each devolved chamber is FOR — why a career would begin there */
const CHAMBER_BLURBS: Record<DevolvedArenaId, string> = {
  scotland: 'Holyrood. A hundred and twenty-nine seats elected by the Additional Member System, so nobody wins a majority twice; a government that runs the NHS, the schools and the courts; and the constitutional question under every other question.',
  wales: 'Cardiff Bay. Sixty members until 2026 and ninety-six after it, a Labour government since devolution began, and a nation arguing about whether it gets its fair share — and in which language.',
};

const LAYER_PILLS: { key: AvatarLayerKey; label: string }[] = [
  { key: 'skin', label: 'Skin' },
  { key: 'hairStyle', label: 'Hair' },
  { key: 'hairColour', label: 'Hair colour' },
  { key: 'eyes', label: 'Eyes' },
  { key: 'brows', label: 'Brows' },
  { key: 'outfit', label: 'Outfit' },
  { key: 'outfitColour', label: 'Outfit colour' },
  { key: 'accessory', label: 'Extras' },
  { key: 'bg', label: 'Backdrop' },
];

export function NewCareerScreen() {
  const startNewGame = useGameStore((s) => s.startNewGame);
  const continueAsProtege = useGameStore((s) => s.continueAsProtege);
  const setStarted = useUiStore((s) => s.setStarted);
  const setLanding = useUiStore((s) => s.setLanding);
  const protege = useUiStore((s) => s.protege);
  const setProtege = useUiStore((s) => s.setProtege);
  const steps = protege ? PROTEGE_STEPS : FULL_STEPS;
  const [step, setStep] = useState(0);
  const stepName: StepName = steps[Math.min(step, steps.length - 1)] as StepName;
  const rootRef = useRef<HTMLDivElement>(null);

  // each stage should open at the top, like a fresh game — otherwise stepping in
  // (e.g. into the Agenda list) keeps the previous step's scroll offset. The window
  // is the scroll container here, with the .screen root as a belt-and-braces.
  useEffect(() => {
    window.scrollTo(0, 0);
    rootRef.current?.scrollTo(0, 0);
  }, [step]);

  const [arena, setArena] = useState<ArenaId>('uk');
  const [era, setEra] = useState<Era>(protege?.era ?? '2024');
  /** for a devolved start, the ISO polling day of the legislature chosen */
  const [devolvedElection, setDevolvedElection] = useState<string>(
    DEVOLVED_LEGISLATURES.scotland[DEVOLVED_LEGISLATURES.scotland.length - 1].election
  );
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('f');
  const [age, setAge] = useState(38);
  const [partyId, setPartyId] = useState<PartyId>(protege?.partyId ?? 'lab');
  const [region, setRegion] = useState<RegionId>(
    protege ? (PARTIES[protege.partyId].contestsRegions[0] as RegionId) : 'yorkshire'
  );
  const [background, setBackground] = useState<BackgroundId>('teacher');
  const [causes, setCauses] = useState<CauseId[]>([]);
  const [avatar, setAvatar] = useState<AvatarConfig>(() =>
    randomAvatar(new Rng((Math.random() * 0xffffffff) >>> 0))
  );
  const [activeLayer, setActiveLayer] = useState<AvatarLayerKey>('hairStyle');

  const validRegions = useMemo(
    () => PLAYER_REGIONS.filter((r) => PARTIES[partyId].contestsRegions.includes(r)),
    [partyId]
  );

  /** the legislatures on offer in the chosen devolved chamber, newest first */
  const devolvedEras = useMemo(
    () => (arena === 'uk' ? [] : [...DEVOLVED_LEGISLATURES[arena]].reverse()),
    [arena]
  );
  const devolvedSnap = useMemo(
    () => devolvedEras.find((e) => e.election === devolvedElection) ?? devolvedEras[0],
    [devolvedEras, devolvedElection]
  );
  /** the parties actually on the ballot in the chosen chamber and era */
  const chamberParties: PartyId[] = arena === 'uk'
    ? playablePartiesForEra(era)
    : (devolvedSnap?.parties ?? []);

  /** move to a chamber, carrying the selection somewhere valid */
  const chooseArena = (a: ArenaId) => {
    setArena(a);
    if (a === 'uk') {
      if (!playablePartiesForEra(era).includes(partyId)) setPartyId('lab');
      return;
    }
    const latest = DEVOLVED_LEGISLATURES[a][DEVOLVED_LEGISLATURES[a].length - 1];
    setDevolvedElection(latest.election);
    if (!latest.parties.includes(partyId)) setPartyId(latest.governing);
    setRegion(CHAMBERS[a].regions[0]);
  };

  const canContinue =
    stepName !== 'You' || name.trim().length >= 2;

  const cycleLayer = (dir: 1 | -1) => {
    const count = AVATAR_COUNTS[activeLayer];
    setAvatar((a) => ({
      ...a,
      [activeLayer]: ((a[activeLayer] + dir) % count + count) % count,
    }));
  };

  const toggleCause = (id: CauseId) => setCauses((cs) => toggleCauseList(cs, id));

  const finish = () => {
    const input = {
      name: name.trim(), gender, age, region, background, partyId, avatar, era, causes,
      ...(arena === 'uk' ? {} : { arena, devolvedElection }),
    };
    if (protege) {
      continueAsProtege(input);
      setProtege(null);
      setStarted(true);
    } else {
      startNewGame(input);
      setStarted(true);
    }
  };

  const devolvedChamber = arena === 'uk' ? null
    : chamberAt(arena, devolvedSnap ? isoToDay(devolvedSnap.election) : Number.MAX_SAFE_INTEGER);

  return (
    <div className="screen nc" ref={rootRef}>
      <div className="nc-steps">
        {steps.map((s, i) => (
          <span key={s} className={`nc-step${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}>
            {s}
          </span>
        ))}
      </div>

      {stepName === 'Chamber' && (
        <div className="fade-in">
          <h2 className="nc-h">Where does your story begin?</h2>
          <button
            className={`card nc-era${arena === 'uk' ? ' selected' : ''}`}
            onClick={() => chooseArena('uk')}
          >
            <strong>The House of Commons</strong>
            <span>
              Westminster. Six hundred and fifty seats, the longest ladder in the
              country and the hardest to climb — and a shot at Number 10 at the top of it.
            </span>
          </button>
          <p className="nc-label" style={{ marginTop: 14 }}>The devolved parliaments</p>
          {DEVOLVED_ARENAS.map((a) => (
            <button
              key={a}
              className={`card nc-era${arena === a ? ' selected' : ''}`}
              onClick={() => chooseArena(a)}
            >
              <strong>{houseHeading(a)}</strong>
              <span>{CHAMBER_BLURBS[a]}</span>
            </button>
          ))}
          <p className="nc-hint" style={{ marginTop: 10 }}>
            A career can move between Westminster and its own nation’s parliament, in
            either direction — but you resign one seat to stand for the other.
          </p>
        </div>
      )}

      {stepName === 'Era' && arena !== 'uk' && (
        <div className="fade-in">
          <h2 className="nc-h">Which {CHAMBERS[arena].place} do you walk into?</h2>
          {devolvedEras.map((e) => (
            <button
              key={e.election}
              className={`card nc-era${devolvedElection === e.election ? ' selected' : ''}`}
              onClick={() => {
                setDevolvedElection(e.election);
                if (!e.parties.includes(partyId)) setPartyId(e.governing);
              }}
            >
              <strong>{formatFull(isoToDay(e.election))}</strong>
              <span>{e.blurb}</span>
            </button>
          ))}
        </div>
      )}

      {stepName === 'Era' && arena === 'uk' && (
        <div className="fade-in">
          <h2 className="nc-h">When does your story begin?</h2>
          {(['2010', '2015', '2017', '2019', '2024'] as Era[]).map((e) => (
            <button
              key={e}
              className={`card nc-era${era === e ? ' selected' : ''}`}
              onClick={() => {
                setEra(e);
                // keep a populist selection valid: remap to the era's actual party
                if (partyId === 'ukip' || partyId === 'brexit' || partyId === 'reform') {
                  const p = populistPartyForEra(e);
                  setPartyId(p);
                  if (!PARTIES[p].contestsRegions.includes(region)) {
                    setRegion(PARTIES[p].contestsRegions[0] as RegionId);
                  }
                }
              }}
            >
              <strong>{ERA_LABELS[e].title}</strong>
              <span>{ERA_LABELS[e].blurb}</span>
            </button>
          ))}
        </div>
      )}

      {stepName === 'You' && (
        <div className="fade-in">
          <h2 className="nc-h">Who are you?</h2>
          <label className="nc-label">Name</label>
          <div className="nc-name-row">
            <input
              className="nc-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Hartley"
              maxLength={30}
            />
            <button
              type="button"
              className="nc-dice"
              title="Randomise name"
              aria-label="Randomise name"
              onClick={() =>
                setName(generateName(new Rng((Math.random() * 0xffffffff) >>> 0), gender, new Set(), region))
              }
            >
              🎲
            </button>
          </div>
          <label className="nc-label">Gender</label>
          <div className="nc-seg">
            {([['f', 'Woman'], ['m', 'Man'], ['nb', 'Non-binary']] as [Gender, string][]).map(([g, label]) => (
              <button
                key={g}
                className={gender === g ? 'active' : ''}
                onClick={() => setGender(g)}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="nc-label">Age — {age}</label>
          <input
            type="range" min={18} max={80} value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="nc-range"
          />
        </div>
      )}

      {stepName === 'Party' && (
        <div className="fade-in">
          <h2 className="nc-h">Pick your colours</h2>
          <div className="nc-parties">
            {chamberParties.map((p) => (
              <button
                key={p}
                className={`nc-party${partyId === p ? ' selected' : ''}`}
                style={{ ['--pc' as string]: PARTIES[p].colour }}
                onClick={() => {
                  setPartyId(p);
                  if (arena === 'uk' && !PARTIES[p].contestsRegions.includes(region)) {
                    setRegion(PARTIES[p].contestsRegions[0] as RegionId);
                  }
                }}
              >
                <span className="nc-party-dot" />
                {partyNameIn(p, arena)}
              </button>
            ))}
          </div>
          {(arena === 'uk'
            ? partyId !== PARLIAMENTS[era].governingParty && partyId !== PARLIAMENTS[era].oppositionParty
            : devolvedSnap && partyId !== devolvedSnap.governing && partyId !== devolvedSnap.opposition) && (
            <p className="nc-hint">
              A smaller party: a harder road to ministerial office, but your voice is your own.
            </p>
          )}
          {arena === 'uk' ? (
            <>
              <label className="nc-label">Where do you stand?</label>
              <select
                className="nc-input"
                value={region}
                onChange={(e) => setRegion(e.target.value as RegionId)}
              >
                {validRegions.map((r) => (
                  <option key={r} value={r}>{REGIONS[r].name}</option>
                ))}
              </select>
            </>
          ) : devolvedChamber && (
            <p className="nc-hint">
              You will sit as {devolvedChamber.member === 'MSP' || devolvedChamber.member === 'MS' || devolvedChamber.member === 'AM' ? 'an' : 'a'}{' '}
              {devolvedChamber.member} in {devolvedChamber.house}
              {partyId === 'sgp' || partyId === 'alba'
                ? ' — on a regional list, where your party actually wins its seats.'
                : ', for a constituency your party holds — or the one it can most plausibly take.'}
            </p>
          )}
        </div>
      )}

      {stepName === 'Background' && (
        <div className="fade-in">
          <h2 className="nc-h">What did you do before?</h2>
          <div className="nc-bgs">
            {BACKGROUND_IDS.map((b) => (
              <button
                key={b}
                className={`card nc-bg${background === b ? ' selected' : ''}`}
                onClick={() => setBackground(b)}
              >
                <strong>{BACKGROUNDS[b].name}</strong>
                <span>{BACKGROUNDS[b].blurb}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {stepName === 'Agenda' && (
        <div className="fade-in">
          <h2 className="nc-h">What do you stand for?</h2>
          <p className="nc-hint" style={{ marginTop: 0 }}>
            Choose up to three causes to champion. They colour your story — and tilt you,
            a little, toward the briefs that fit. {causes.length}/{MAX_CAUSES} chosen.
          </p>
          <CauseGrid selected={causes} onToggle={toggleCause} />
        </div>
      )}

      {stepName === 'Look' && (
        <div className="fade-in">
          <h2 className="nc-h">Looking the part</h2>
          <SwipeCarousel
            onPrev={() => cycleLayer(-1)}
            onNext={() => cycleLayer(1)}
            caption={`${LAYER_PILLS.find((l) => l.key === activeLayer)?.label} ${avatar[activeLayer] + 1} / ${AVATAR_COUNTS[activeLayer]}`}
          >
            <Avatar config={avatar} size={170} partyColour={PARTIES[partyId].colour} />
          </SwipeCarousel>
          <div className="nc-pills">
            {LAYER_PILLS.map((l) => (
              <button
                key={l.key}
                className={`nc-pill${activeLayer === l.key ? ' active' : ''}`}
                onClick={() => setActiveLayer(l.key)}
              >
                {l.label}
              </button>
            ))}
            <button
              className="nc-pill nc-dice"
              onClick={() =>
                setAvatar(randomAvatar(new Rng((Math.random() * 0xffffffff) >>> 0)))
              }
            >
              🎲 Surprise me
            </button>
          </div>
          <p className="nc-hint">Swipe the portrait (or use the arrows) to change the selected feature.</p>
        </div>
      )}

      <div className="nc-nav">
        <button
          className="btn"
          onClick={() => {
            if (step > 0) setStep(step - 1);
            else if (protege) setProtege(null); // back to the end screen
            else setLanding('menu');
          }}
        >
          Back
        </button>
        {step < steps.length - 1 ? (
          <button
            className="btn btn-primary"
            disabled={!canContinue}
            style={{ opacity: canContinue ? 1 : 0.5 }}
            onClick={() => canContinue && setStep(step + 1)}
          >
            Next
          </button>
        ) : (
          <button className="btn btn-primary" onClick={finish}>
            Take your seat
          </button>
        )}
      </div>
    </div>
  );
}
