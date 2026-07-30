# WestminsterSim

A mobile-first political life simulator. You are a newly-elected UK MP: survive the
whips, climb (or refuse) the ministerial ladder, fight elections, and maybe —
eventually — walk through the door of Number 10.

Entirely fictional people; real parties and real starting parliaments.

## Play

```bash
npm install
npm run dev        # http://localhost:5173 — designed for a ~380px phone viewport
```

Append `?debug` to the URL for the dev panel (advance time, force elections,
reshuffles, leadership vacancies, max stats).

## How it works

- **Start dates** — first day of the 2019 parliament (Con majority 80) or the
  2024 parliament (Lab landslide 411). Seat compositions are exact; history
  diverges procedurally from day one.
- **The loop** — each ordinary decision advances the clock one or two months. A
  scheduler interleaves forced sequences (reshuffles, dismissals, leadership
  ballots, election campaigns), calendar events (Budget, conference, locals,
  recess) and a weighted card draw with cooldowns and token templating. Stats
  follow diminishing returns — easy to build, hard to max — and genuinely gate
  promotion.
- **Career** — eligibility for office is scored from competence, leader/whip
  relationships, standing, profile, rebellions and your background. The early
  ladder (PPS, minister) comes quickly to strong performers; the top stays hard.
  Mirrored shadow roles in opposition; sideways moves, emergency reshuffles, and
  — as leader — interactive reshuffles of your own cabinet (and a Cabinet-tab
  "Sack" button). You can resign any office at will (as leader, an NPC succeeds
  you) and your career remembers its peak, so a principled resignation doesn't
  send you back to the bottom. Leadership contests are six-stage affairs against
  3–6 named rivals (declaration → two ballots → hustings → endorsement → final
  head-to-head), and losing carries a real cost. You can also cross the floor to
  another party, at a price the voters will name. As PM or LO, general elections
  become a seven-stage make-or-break campaign that genuinely moves the polls; a
  living opposition reshuffles itself and changes its own leaders between
  elections, and NPC PMs call late-term or snap elections and occasionally resign.
- **Elections** — 650 synthetic constituencies generated to match the real
  starting parliament, swung by a regional-sensitivity model from national
  polling (random walk + mean reversion + cost-of-governing drag + event
  shocks). Your seat gets a personal vote from constituency approval.
- **Saves** — one career auto-saves to localStorage after every decision.

## Commands

| | |
|---|---|
| `npm run dev` | dev server |
| `npm test` | engine test suite (data integrity, election calibration, balance sims) |
| `npm run build` | production build |

## Mobile release

Capacitor wraps `dist/` for both stores. `npm run android` / `npm run ios` build the
web bundle, sync it into the native project, and open the IDE.

### Android toolchain

Building from the command line needs a JDK 17+ and the Android SDK. Android Studio
bundles both if you use its UI; for terminal builds, the SDK lives at the path in
`android/local.properties` (gitignored) and Java comes from Studio's bundled runtime:

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

SDK packages required: `platform-tools`, `platforms;android-36`, `build-tools;36.0.0`.

### Signing

Android release builds are signed with an upload key that lives outside the repo.
Create it once, then keep the `.jks` and its passwords in a password manager — lose
them and the Play listing can't be updated:

```bash
keytool -genkey -v -keystore android/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

Then write `android/keystore.properties` (gitignored):

```
storeFile=upload-keystore.jks
storePassword=…
keyAlias=upload
keyPassword=…
```

Build the bundle to upload to the Play Console:

```bash
npm run build && npx cap sync android && (cd android && ./gradlew bundleRelease)
```

Output lands at `android/app/build/outputs/bundle/release/app-release.aab`. Bump
`versionCode` in `android/app/build.gradle` for every upload.

## Stack

React 18 + TypeScript + Vite, Zustand (persisted), plain CSS, hand-rolled
seeded PRNG (a save fully determines the future). No backend.
