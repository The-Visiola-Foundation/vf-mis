# SC — STEM Camps impact

Self-contained module in `src/sc/`, registered in `src/app.module.ts`.
Style matches `sc-participation` (thin services, `class-validator` DTOs, Swagger, `{ success: true }` deletes, global `{ statusCode, data }` envelope).

## Routes

- `GET /sc/camps` — list camps for the selector (`id, type, year, theme, hasResults`).
- `GET /sc/camps/:campId/impact` — one payload for the dashboard STEM Camps page.
- `GET /sc/years/:year/rollup` — both-camps view (Board allowed).
- `GET /sc/compare?core=<core_code>` — a core measure across camps (Board allowed).
- `POST /sc/camps` — create a camp (staff only).
- `PUT /sc/camps/:campId/results` — bulk upsert of measures + results (staff only).
- `POST /sc/camps/:campId/import` — `501` stub for a later CSV step.

Authorisation: `RolesGuard` + `@Roles(...)`. Staff (`admin`, `key_staff`, `programme_staff`) get everything; `board` gets only year roll-up and compare. Writes additionally require a JWT via the global `AccessTokenGuard` (GETs are open by existing convention).

## Rules enforced

- Percentages derived from stored counts (`pctFromCounts`); never stored.
- Year roll-up: unique participants counted once, spend summed, means pooled weighted by `n` (`pooledMean`). Never average-of-averages; p-values never combined (year `pValue: null`); core measures only.
- Unknowns are `null`, never `0`. Empty camp returns empty state (`hasResults: false`, `participants.total: null`).
- PG `numeric` exposed as numbers via `ColumnNumericTransformer` (`src/common/transformers/numeric.transformer.ts`).
- p-values computed in Node (`pairedTTestPValue`, jstat paired two-tailed t-test) when raw scores submitted; stored in `sc_measure_result`.
- Validation: `p_value` 0–1, means within `scale_min/max`, `core_code` unique per camp, `campId` matches `YYYY-TYPE` (`2026-SUMMER`).

## Migrations

```bash
npm run migration:run      # up
npm run migration:revert   # down (one step)
```

Order: `ScTables` (role column + lookups + seeds) → `ScCoreTables` (DDL) → `ScViews` (`vf_reporting` views + Board grants) → `ScSeed2026Summer/Results/Extras` (2026 data). Dev still uses `synchronize: true`; migrations are authoritative for deploy.

## Example: GET /sc/camps/2026-SUMMER/impact (shape)

```json
{
  "statusCode": 200,
  "data": {
    "camp": { "id": "2026-SUMMER", "type": "Summer STEM Camp", "year": 2026, "theme": "Renewable Energy", "venue": null, "startDate": null, "endDate": null, "durationDays": 8, "hasResults": true },
    "participants": { "total": 97, "teams": 10, "byClass": { "SS 1": 58, "SS 2": 36, "SS 3": 2, "JSS 3": 1 }, "byTrack": { "Science": 86, "Arts": 7, "Commercial": 3, "Technology": 1 }, "attendance": [] },
    "selfEfficacy": [
      { "coreCode": "SE_GENDER_BELIEF", "name": "Gender belief", "category": null, "isCore": true, "scaleMin": 1, "scaleMax": 5, "n": 77, "meanA": 4.0, "meanB": 4.6, "change": 0.6, "pValue": null, "significant": true, "improvedN": null, "declinedN": null, "sameN": null },
      { "coreCode": "SE_STEM_CAREER", "name": "STEM career likelihood", "category": null, "isCore": true, "scaleMin": 1, "scaleMax": 5, "n": 77, "meanA": 3.9, "meanB": 4.12, "change": 0.22, "pValue": null, "significant": false, "improvedN": null, "declinedN": null, "sameN": null }
    ],
    "assessment": { "bothTestsN": 87, "perfectPreN": 33, "largestGain": 38, "difficultyMatched": false, "note": null, "knowledge": [{ "coreCode": "KNOW_OVERALL", "name": "Knowledge test overall", "n": 87, "meanA": 88.2, "meanB": 88.8, "change": 0.6 }] },
    "observation": { "points": [{ "pointNo": 1, "label": "Baseline", "dayNumber": null, "nObserved": 94 }], "measures": [] },
    "feedback": { "invitedN": null, "responsesN": 96, "meanSatisfaction": 4.6, "pct4Or5": null, "invalidN": 7, "ratingDist": [], "items": [], "interestAreas": [{ "area": "Renewable energy", "baselinePct": 0, "endlinePct": 12, "n": null }], "activities": [], "improvements": [] },
    "projects": [{ "teamNumber": 8, "name": null, "description": null, "technologies": null, "resultPosition": 1, "judging": [] }],
    "awards": [{ "category": "Camp winner: Team 8", "participantId": null, "age": null }],
    "partners": [],
    "expenses": { "total": 26828832.5, "currency": "NGN", "lines": [{ "category": "Total camp spend", "amount": 26828832.5, "currency": "NGN" }], "costPerParticipant": 276582.81 },
    "recommendations": []
  }
}
```
