# Breeze / Freshpurr

A browser-based cat asthma journal with symptom logs, medications, dose history,
profile editing, PDF exports and JSON backups.

## Run

```sh
npm ci
cp .env.example .env
npm run dev
```

For production, run `npm run build`, then `NODE_ENV=production npm start`.
The server respects `PORT` (default 3000). Static-only hosting / `vite preview`
does not serve the environmental API. No Gemini key is needed.

## Care records

Records are saved on the current browser using `breeze_care_v1`. There is no
account or cross-device sync. Profile provides JSON backup download and restore;
restoring explicitly replaces the current care records. Keep regular backups,
especially before clearing browser data. Invalid stored records are preserved,
with a visible error, rather than silently replaced with an empty journal.
Concurrent tabs sync storage events; detected conflicts block writes and ask the
user to back up and reload.

Medication stock counts doses remaining. Edit / refill sets the remaining count.
Each scheduled daily time can be marked taken or missed once per day; overdue
slots stay visible, then roll forward after being recorded. As-needed medication
has no reminder times. Dose history supports undo and is retained when medication
is deleted. Reminder notifications require permission and this page to be open;
browsers may suspend background tabs. Use a phone alarm for reliable reminders.

## Environmental readings

Singapore uses NEA 24-hour PSI and 1-hour PM2.5, with the nearest named region.
Elsewhere Google Universal AQI is used (higher is better). Index labels and risk
mapping remain distinct. Missing humidity or pollen is shown as unavailable.
Pollen categories derive from numeric UPI values, covering tree, grass and weed.
Outdoor environmental indicators do not predict an individual cat's attacks.
Historical charts and summaries derive only from recorded logs; they describe
suspected triggers rather than establishing causation. Humidity is plotted only
when an actual reading was captured with a log. Readings refresh every 15 minutes.

`GOOGLE_MAPS_API_KEY` is server-only and needed for location search / global data.
Enable Geocoding, Air Quality and Pollen APIs for the key. Singapore GPS readings
use public NEA endpoints without this key. API calls have validated inputs,
timeouts, request coalescing, five-minute bounded caching, a per-IP limit of
30 requests/minute and a global upstream budget (default 200 requests/hour).
Limits are per server process and reset on restart; configure provider quotas
and a shared gateway limiter for multi-instance production deployments. No public
endpoint accepts arbitrary upstream payloads. Provider errors never become
fabricated healthy readings.

## Verify

```sh
npm test
npm run lint
npm run build
```

Tests cover data/date restoration, validation, medication scheduling and stock,
profile and symptom flows across remounts, refill/delete/undo, invalid reminder
times, corrupt storage preservation, environmental failure states, historical
aggregation, pollen and AQI mapping, Singapore labels and actual PDF generation.
DOM interaction tests do not replace device/browser notification testing.
