# GRID past-event milestone intake

## Evidence found

The checked-in repository, Timeline handoff/session documentation, and available Git history did not contain reliable, source-backed names and dates for past GRID events. The `GRID project showcase` string in a Flask test is fixture data, not evidence of an actual event, so it is intentionally excluded. No milestones have been created or published from this search.

## Information needed from the team lead

For each event, provide:

- Confirmed event title and event date (including year); time and timezone if useful.
- Venue or location, if it should appear publicly.
- Approved category: `Events`, `Workshops`, `Achievements`, `Projects`, or `Community`.
- A short card summary and a source-backed full description.
- A source reference: public URL or repository file/path, plus who verified it and when.
- Approved image files and their source/attribution or usage permission; do not use unrelated photos.
- Confirmation that the item belongs in the Timeline and should remain a draft for review. Publication requires a separate explicit approval.

## Import template

Fill `PAST_EVENTS_IMPORT_TEMPLATE.json` with verified details. Keep `milestone.isPublished` set to `false`. The outer `source` object is provenance metadata for review; only the inner `milestone` object maps to the Timeline API. The blank template is intentionally incomplete and must not be submitted until every required milestone field has been verified. Images should be added only after the files and their permission/source are confirmed.

After review, create draft milestones through the admin UI and retain the source reference with the team’s content records. Do not publish them automatically.
