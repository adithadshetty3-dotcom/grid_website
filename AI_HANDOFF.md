# GRID Timeline — AI Handoff

> Shared context for the people and AI assistants working on the GRID Timeline section.
>
> **Scope:** Timeline is the team's required deliverable. Journal is optional and may be attempted only if Timeline is complete and time remains.

## 1. Project scope and ownership

GRID's website is a multi-page website for the GRID tech club at KSSEM. Different groups are responsible for different sections.

### Our responsibility
1. **Timeline — primary priority.** Build a clear, engaging record of GRID's journey through significant milestones.
2. **GRID Journal — optional.** Consider this only after Timeline is complete, tested and reviewed, and only if time permits.

### Outside our scope
Unless the team explicitly changes assignments, this group is not responsible for building or taking ownership of:
- Home
- About Us
- Core Team
- Events / Event Archive
- FAQ
- Contact
- Site-wide navbar or footer
- The overall admin dashboard or unrelated website features

Other groups own those areas. Our Timeline should eventually fit into the main website's agreed layout and navigation. Do not create a competing full website as part of this assignment.

### Timeline is not the Event Archive
- **Timeline:** A curated history of GRID, highlighting significant milestones and memorable moments.
- **Event Archive:** Detailed records of individual events, including full event information and photos.

A major event may appear as a Timeline milestone and link to its full Event Archive entry. Timeline should not duplicate every event record.

## 2. Timeline requirements

The Timeline should help visitors understand GRID's journey over time.

### Planned MVP
- Short introduction to GRID's journey.
- Milestones arranged chronologically and grouped by year.
- Year navigation to jump to a particular period.
- Category filters. Suggested categories: Events, Workshops, Achievements, Projects and Community.
- Milestone cards with date, title, category, short description and image where available.
- An expanded/detail view for additional information.
- A Timeline-scoped authoring interface in the pilot so authenticated administrators can add, edit and delete curated milestones. The pilot form includes title, category, date, optional time and location, short summary, full description and multiple photos. Month and year are derived from the date.
- The authoring interface is not the overall admin dashboard. It must use the main website's real admin permissions and shared content API before production; the current pilot's browser-only admin switch/storage are for local UI review only.
- Optional links to related Event Archive entries or Journal articles when those pages exist.
- Responsive desktop, tablet and mobile layouts.

### Initial visual direction (proposal, not final)
- Desktop: vertical timeline with a central line and cards alternating on either side.
- Mobile: single-column timeline.
- Use the shared GRID design system.
- Keep motion subtle and respect reduced-motion preferences.

The exact year-navigation style, category list, ordering and milestone detail interaction must be agreed by the Timeline contributors before implementation.

### Content integrity
Use real GRID milestones, dates, achievements, event names and photos supplied or verified by the team. **Never invent GRID history or present sample content as real.** Clearly label temporary placeholders used during UI development.

## 3. Optional Journal scope

Journal is a secondary, time-permitting extension—not part of the required first delivery. Possible later features include a Journal landing page, featured articles, article cards, individual article pages, categories and monthly archives. Topics may include technology, workshops, event recaps, projects, tutorials and community stories.

Do not begin Journal until the Timeline MVP is complete, tested and reviewed. If time is short, leave Journal for a later phase.

## 4. Technology and implementation approach

The Timeline contributors have chosen to experiment with **React** for their assigned section, using:
- React
- Vite
- React Router if routing is needed for the pilot or integration
- CSS, reusing the existing GRID stylesheet

Both primary contributors are React beginners. Explain concepts and commands before asking them to use them. Prefer small, understandable components and step-by-step guidance over unexplained code dumps.

### Scope of the React pilot
The pilot is **Timeline-first**. Do not build a separate full GRID website, homepage, site-wide navigation, footer, Events page or admin dashboard as part of this assignment.

The final main-site framework and integration method are team-level decisions. A standalone React pilot is an experiment; do not assume it can be dropped into the main site without integration work. Coordinate with the overall team before changing shared architecture or deployment.

A possible initial component breakdown:
- Timeline page
- Reusable MilestoneCard
- Year navigation
- Category filter controls
- Milestone detail/expanded view
- Timeline-specific CSS

Use local structured data during the first UI build. Keep content separate from presentation through `src/timelineRepository.js` so it can later connect to the main site's agreed content source. The current pilot adapter uses browser IndexedDB for local preview only; it is not shared across visitors or devices. Do not independently build the overall admin dashboard.

### Existing remote repository state at handoff creation
The remote `feature/Timeline` branch contained:
- `Timeline.html` — empty file.
- `style.css` — shared GRID design system.
- `nav (1).html` — shared navigation/footer reference.
- `navbar.html` — empty file.
- `README.md` and `.gitignore`.

There was no React/Vite app or implemented Timeline page on this remote branch at that time.

A contributor has started a **local-only** React/Vite experiment on a separate local branch named `experiment/react-timeline-journal`. Node.js, npm and Git worked on that Mac; React Router was installed and the default Vite starter page loaded at `http://localhost:5173/`. That experiment had not been committed or pushed to GitHub when this document was written. Do not describe it as part of the shared branch until it is actually added.

## 5. Shared design system — must follow

The existing repository-root `style.css` is the source of truth for shared styling. Read it before writing page styles.

Important existing tokens and conventions:
- Background: `--bg-void: #0A0A0C`
- Raised surface: `--bg-surface: #121215`
- Primary accent: `--accent: #D81E3F` (crimson)
- Deep accent: `--accent-dim: #7A0F22`
- Primary text: `--text-primary: #F2EFEA`
- Muted text: `--text-muted: #8A8690`
- Display font: Space Grotesk
- Body font: Inter
- Glass surface: `.glass`
- Shared card: `.card`
- Shared buttons: `.btn`, `.btn-primary`, `.btn-ghost`
- Shared content width: `.container` (1120px maximum)

Rules:
1. Link/import the existing `style.css` before Timeline-specific CSS.
2. Reuse its variables and shared classes.
3. Put Timeline-specific styling in a separate file where practical.
4. Do not unnecessarily rewrite, duplicate or override the shared stylesheet.
5. Do not introduce an unrelated palette, font system or site-wide reset.
6. Keep layouts responsive and respect existing accessibility and reduced-motion rules.

## 6. Contributor and AI-assistant working preferences

- The two primary contributors are React beginners; teach as you build.
- One contributor uses macOS and prefers the built-in Terminal; the other uses Windows. Give OS-specific commands when they differ.
- Explain what commands do before asking beginners to run them.
- Prefer copied terminal output, text descriptions and error messages over screenshots. Do not request screenshots or image uploads unless a visual issue genuinely requires them; conserve the contributor's image-upload allowance.
- Never assume code has been applied or tested just because instructions were provided. Verify using actual files, terminal output or contributor confirmation.
- Never invent project history, implementation status, test results or commit details.

## 7. Git and shared-repository permissions

- Work on the agreed Timeline branch or an explicitly approved working branch.
- Do not push experimental work to `main`.
- Do not modify other groups' files or shared architecture without explicit coordination and authorization.
- Before any GitHub write, commit, push, branch creation or pull request, ensure the contributor has authorized that specific action.
- Keep changes focused on Timeline unless the team explicitly expands the assignment.

## 8. AI_HANDOFF.md — mandatory project rule

**Every single project commit must include an updated and staged `AI_HANDOFF.md` in that same commit. No exceptions.**

**Also update this file after every meaningful project work session or implementation change, even when the work remains local and no commit or push is planned.** A handoff update is part of the work itself, not something reserved for publishing. Record feedback, decisions, local changes, test results and the next steps factually. Keep the local handoff current; stage it with the code only when a commit is later authorized.

Every update must explain:
1. What we changed.
2. Why we changed it.
3. How we implemented it.
4. Which files we modified.
5. What works currently.
6. What has not been completed.
7. Known errors or bugs.
8. What needs to happen next.
9. How to run and test the application.

### Development log
Maintain a `COMMIT / SESSION HISTORY` in this file. Add a separate, factual entry for every commit. Each entry must include:
- Entry number and feature/task.
- Changes made and why.
- Implementation details.
- Files modified.
- Current working functionality.
- Tests performed and actual results.
- Known errors or bugs.
- Pending work and next steps.
- Instructions to run and test the current application.

Only describe completed work as completed. Keep planned features marked as planned or pending. Append new entries; do not overwrite previous history.

### Pre-commit enforcement
A Git pre-commit hook is included in the Timeline pilot files at `.githooks/pre-commit`; it calls `scripts/check-ai-handoff.mjs`. It allows a commit only when the root `AI_HANDOFF.md` appears in the staged changed-file list, and otherwise blocks with instructions.

**Current clone status (verified 10 November 2026):** `git config --get core.hooksPath` returns `.githooks`, and `.githooks/pre-commit` is executable. The hook ran during the Session 032 implementation commit and Session 033 handoff commit; both commit attempts printed `GRID handoff check passed: AI_HANDOFF.md is updated and staged.`

### Required workflow
`Plan → Implement → Test → Update AI_HANDOFF.md → Stage changes → Verify handoff update → Commit`

## 9. Current status and next actions

### Completed and verified
- The isolated React + Vite Timeline pilot is published on `feature/Timeline` in `react-pilot/`; it is not merged into `main` and is not deployed.
- The Timeline includes chronological milestones, year/category filters, milestone detail views and a Timeline-only Admin Preview/editor. Admin Preview is the final Timeline section.
- Mobile uses the shared charcoal background and retains the independent white-star canvas. Stars are separate white dots without red connecting lines. The desktop crimson gradient remains unchanged.
- Timeline spacing was refined for desktop and mobile. The root `style.css` remains unchanged.
- All source tests under `react-pilot/src/` passed: 88/88. The production build passed. AI handoff validation and both Git whitespace checks passed for Session 032.
- Implementation commit `33905d3d3b4507263e9f067f219dddc6199ff541` (`Complete Timeline background and layout refinements`) was pushed to `origin/feature/Timeline`.
- Handoff publication commit `623953a51d383ec5a8d4d0c5ac443f9ba5c72c4a` (`Record Timeline publication status`) was pushed to `origin/feature/Timeline`.
- Before preparing Session 034, fetched `origin/feature/Timeline`; local `HEAD` and `origin/feature/Timeline` both equalled `623953a51d383ec5a8d4d0c5ac443f9ba5c72c4a` (0 ahead, 0 behind). The five untracked SESSION README files were preserved.

### Not completed
- Actual desktop browser and physical-phone visual reviews have not been performed.
- Demo milestones still need replacement with GRID content, dates and photos verified by the team.
- Admin Preview is a local pilot control, not production authentication. It must use the main website's verified admin permissions.
- Milestones and photos use IndexedDB local to one browser/device. Shared backend/API integration and persistent shared storage remain pending.
- Final integration approval from the main GRID website team remains pending.

### Next actions
The items below are pending. PR [#6](https://github.com/adithadshetty3-dotcom/grid_website/pull/6) was verified on 10 November 2026 as **open**, targeting `main` from `feature/Timeline`; it has not been merged. The React + Vite pilot is available for review, but the technology and integration approach still need team approval.

#### A. Lead review and approval
- [ ] Share PR #6 with the GRID team lead.
- [ ] Obtain review and feedback on the Timeline implementation.
- [ ] Explain the React + Vite pilot and seek approval for this approach.
- [ ] Confirm that the Timeline design and functionality meet the team's expectations.
- [ ] Record requested changes and complete them after approval.
- [ ] Agree on the final integration approach with the main website team.
- [ ] Do not merge into `main` without the required approval.

#### B. Timeline Admin / content management proposal
Pitch a Timeline-specific content management interface to the lead. This is a proposal only; the current Admin Preview is a local UI prototype, not production authentication or shared storage. The proposed interface could let authorised members add, edit and remove milestones; upload and manage photographs; enter dates, titles, descriptions and categories; preview content before publication; and potentially use draft and approval workflows.

Questions for the lead:
- [ ] Is this feature approved?
- [ ] Should it be part of the existing main-site admin dashboard or remain a Timeline-specific area?
- [ ] Which team members should have permission to edit it?
- [ ] Should changes publish immediately or require approval?
- [ ] What authentication and backend should it use?

#### C. Collect historical GRID Timeline content
- [ ] Ask the lead for previous years' Timeline information.
- [ ] Request major events, workshops, achievements and projects.
- [ ] Request verified dates, titles, categories and descriptions.
- [ ] Request official photographs and relevant captions.
- [ ] Ask for old archives, documents or spreadsheets if available.
- [ ] Confirm the accuracy of every milestone with the team.
- [ ] Replace demo milestones only with verified GRID content.

Suggested content format: **Year, date, title, category, short summary, full description, photos, photo credits/permissions and related links.** Keep the Timeline a curated history of significant milestones, not a duplicate of the full Event Archive.

#### D. Official GRID logo and branding
- [ ] Locate existing official GRID logo assets in the repository.
- [ ] Ask the lead/design team for the approved logo if necessary.
- [ ] Prefer SVG; accept a transparent high-resolution PNG.
- [ ] Request suitable light/dark variants and brand guidelines.
- [ ] Confirm correct logo placement and size within the Timeline.
- [ ] Coordinate with the navbar team if the logo is intended for the shared site header.
- [ ] Keep any logo implementation within Timeline-owned components; do not modify another team's navbar.

Do not invent, redraw or use an unofficial logo.

#### E. Visual review and polish
- [ ] Review the full Timeline on desktop.
- [ ] Review it on an actual phone.
- [ ] Test narrow widths, landscape orientation and scrolling.
- [ ] Verify star visibility and background behavior.
- [ ] Check logo placement, typography, spacing and readability.
- [ ] Test all Timeline filters, details and Admin Preview actions.
- [ ] Check keyboard navigation, focus states and reduced motion.
- [ ] Verify image upload, display and error handling.
- [ ] Remove or replace all demo content before production.

#### F. Production integration and readiness
- [ ] Confirm the main website's framework and routing approach.
- [ ] Agree on how the React pilot will be integrated.
- [ ] Confirm shared CSS and asset integration.
- [ ] Replace IndexedDB with approved shared backend/API storage.
- [ ] Implement real authentication and authorisation.
- [ ] Define who can create, edit, approve and publish milestones.
- [ ] Implement shared image storage and upload validation.
- [ ] Test persistence across browsers and devices.
- [ ] Coordinate production deployment and final acceptance.

#### G. Optional future work
- [ ] Consider links from Timeline milestones to Event Archive entries or relevant Journal articles where appropriate.
- [ ] Consider GRID Journal only after Timeline is completed, reviewed and approved, and only if time permits.

Do not start unrelated pages or optional Journal work now.

### Run and test instructions
- From the repository root: `cd react-pilot`.
- Start locally: `npm run dev`.
- Run every source test: `node --test src/*.test.js`.
- Verify production compilation: `npm run build`.
- `npm test` runs the configured milestone validation tests.
- These instructions run only the isolated Timeline pilot. Browser data remains local to the current device until a shared API is integrated.

## 10. Commit / session history

### Entry 001 — Add the Timeline AI handoff

**Feature/task:** Establish shared project context and mandatory handoff rules.

**Changes made:**
- Add this `AI_HANDOFF.md` at the repository root on `feature/Timeline`.

**Why:**
- Give Timeline contributors and future AI assistants one shared source for scope, decisions, current status and workflow rules.

**Implementation:**
- Created a Markdown handoff covering ownership, Timeline requirements, optional Journal scope, React pilot approach, shared design rules, contributor preferences, Git permissions and commit discipline.

**Files modified:**
- `AI_HANDOFF.md`

**Working currently:**
- This file is ready to be committed as the first Timeline handoff commit on `feature/Timeline`.

**Testing:**
- Verified the target branch existed and inspected its files before preparing the document.
- The document itself has not yet been published to GitHub; verify the commit and file after pushing.

**Known issues / incomplete work:**
- The pre-commit hook is not implemented.
- Timeline functionality is not implemented.
- Local React pilot changes are not yet in this shared branch.

**Next:**
- Commit and push this handoff to `feature/Timeline`, review it with the Timeline contributors, then agree on Timeline details before implementation.

**Run/test:**
- No application code is changed by this documentation-only commit. The local-only Vite starter instructions are in Section 9.

### Session 002 — Timeline interaction and authoring requirements (not yet committed)

**Feature/task:** Start the isolated React + Vite Timeline pilot, with a full milestone detail view and Timeline-only milestone authoring controls.

**Changes prepared:**
- Added the Timeline pilot under `react-pilot/` with year grouping, year/category filters, alternating responsive milestone cards and a full detail/gallery dialog.
- Added a Timeline-scoped editor for adding, editing and deleting milestones, with title, category, date, optional time/location, summary, full description and up to eight image uploads (10 MB each).
- Month and year are derived from the ISO date field.
- Added a browser IndexedDB repository adapter for local preview data and image Blobs; this is intentionally not shared production storage.
- Seeded two clearly labelled demo-only milestones so the page can be previewed without inventing GRID history.
- Added `.githooks/pre-commit` and `scripts/check-ai-handoff.mjs` to enforce the staged handoff requirement.
- Added setup and limitation notes in `react-pilot/README.md`.

**Why:**
- Turn the agreed Timeline requirements into an isolated, understandable pilot without taking on other site sections or a competing admin dashboard.
- Keep the authoring UI limited to Timeline milestones while leaving real authentication and shared persistence to the main website's agreed integration.

**Files prepared:**
- `react-pilot/package.json`
- `react-pilot/index.html`
- `react-pilot/vite.config.js`
- `react-pilot/.gitignore`
- `react-pilot/README.md`
- `react-pilot/src/main.jsx`
- `react-pilot/src/App.jsx`
- `react-pilot/src/timeline.css`
- `react-pilot/src/timelineRepository.js`
- `.githooks/pre-commit`
- `scripts/check-ai-handoff.mjs`
- `AI_HANDOFF.md`

**Working currently:**
- Source code is prepared for the requested Timeline interactions.
- The hook test passed in a temporary Git repository: it blocked a commit without staged `AI_HANDOFF.md` and allowed a commit when the file was staged.

**Testing performed and actual results:**
- `node --check` passed for `timelineRepository.js`, `vite.config.js` and `check-ai-handoff.mjs`.
- TypeScript's JSX parser/transpiler accepted `main.jsx` and `App.jsx` with no syntax diagnostics.
- PostCSS parsed `timeline.css` successfully.
- The pre-commit block/pass test succeeded in a disposable temporary Git repository. The test commit was not made in the GRID repository.
- `npm install --no-audit --no-fund` timed out in the current environment; Vite/React dependencies were not installed here. No Vite build or browser runtime test is claimed.

**Known limitations / incomplete work:**
- The admin preview switch is not authentication; the UI must be wired to the site's actual verified admin permission before deployment.
- IndexedDB is local to one browser/device; shared content must be backed by the main site's approved API before production.
- Demo milestones are placeholders and must be replaced with real team-verified content before publishing.
- Browser runtime, mobile behavior, real photo persistence and production build remain to be tested locally after dependencies install.
- Nothing in this session has been committed or pushed to GitHub.

**Next:**
- Integrate these files into the agreed local `feature/Timeline` working tree, run `npm install` and `npm run dev`, then verify the interactions in a browser.
- Enable and test the pre-commit hook in that actual clone.
- Coordinate the API/auth integration contract and use only verified GRID content.

**Run/test:**
- From repository root: `cd react-pilot`, `npm install`, `npm run dev`.
- For a production build: `npm run build` from `react-pilot`.
- Enable the hook once per clone from repository root: `git config core.hooksPath .githooks` (and `chmod +x .githooks/pre-commit` on macOS/Linux/Git Bash as needed).



### Session 003 — Edit modal and visual refinement (initially local, then applied by contributor)

**Feature/task:** Improve the Timeline-only editor experience and make the Timeline visual design feel more polished and fluid.

**Contributor feedback:**
- The contributor manually tested the initial local Vite page and confirmed: Timeline display, full detail view, year/category filters, admin preview, adding events with multiple photos, persistence after browser refresh, and edit/delete were working.
- The edit action was functionally working but rendered the editor at the top of the page, forcing the contributor to scroll back up. The contributor requested a popup/modal editing experience, smoother motion and a less bland visual design.
- The contributor explicitly requested that `AI_HANDOFF.md` be updated after every meaningful session, including sessions with no GitHub push or commit. This requirement is now recorded in Section 8.

**Changes prepared in this session:**
- Converted the add/edit editor from an in-page panel to a centered, fixed overlay dialog. It can be dismissed with Escape or by clicking the backdrop (unless saving), and its own content scrolls inside the dialog so editing stays at the current page position.
- Added initial focus to the title field, a keyboard Tab focus loop, Escape handling, scroll locking and focus restoration when the editor closes.
- Refined Timeline-only visual details: atmospheric background layers, subtle grid texture, more depth on milestone cards, improved category chips and filters, refined year markers, richer hover states and consistent modal styling.
- Added IntersectionObserver-based reveal transitions for year groups and milestone rows, plus a pulsing hero marker. Reduced-motion preferences still disable the motion effects.
- Kept the shared `style.css` untouched and kept all changes within Timeline pilot files.

**Files modified in this local working copy:**
- `react-pilot/src/App.jsx`
- `react-pilot/src/timeline.css`
- `AI_HANDOFF.md`

**Working currently:**
- The contributor has confirmed the original app interactions work locally. The updated source now contains the modal editor and visual refinements, prepared as a replacement bundle for the contributor to apply and test.

**Testing performed and actual results:**
- Manual testing of the *previous* pilot version was reported by the contributor: all seven listed checks passed, with the noted edit-editor positioning issue.
- TypeScript's JSX transpiler parsed `react-pilot/src/main.jsx` and `react-pilot/src/App.jsx` with zero syntax diagnostics.
- `node --check` passed for `timelineRepository.js`, `vite.config.js` and `scripts/check-ai-handoff.mjs`.
- PostCSS parsed `react-pilot/src/timeline.css` successfully (232 top-level rules).
- At the end of Session 003, the new edit modal, visual refinements, keyboard behavior and responsive changes had not yet been tested by the contributor in their browser. The later local production build result is recorded in Session 004.
- No Git commit or push was made. The source bundle and local handoff update are prepared only.

**Known limitations / incomplete work:**
- The latest modal and visual changes need a local browser retest. A production build has since passed, as recorded in Session 004.
- Actual admin authentication, shared cross-device persistence and the approved main-site API remain out of scope for this pilot and are required before production.
- Demo records remain placeholders and must be replaced with team-verified GRID milestones before publishing.

**Next:**
- After the refinement bundle was applied, re-test that Edit opens a centered popup directly over the current page position.
- Test modal close/save/cancel, keyboard focus, event editing and photo retention, then review motion and mobile layout.
- Keep this handoff updated on every meaningful session, regardless of commit/push status, and synchronize the updated handoff to the remote `feature/Timeline` branch as requested by the contributor.

**Run/test:**
- From the repository root: `unzip -o ~/Downloads/grid_timeline_refinement.zip -d .` to overlay the updated Timeline files and root `AI_HANDOFF.md` (this leaves unrelated repository files untouched).
- Then run: `cd react-pilot`, `npm run dev`; open the local URL printed by Vite. Run `npm run build` from `react-pilot` for a production build check.
- The refinement bundle was applied locally; its code has not been committed or pushed.


### Session 004 — Local refinement build verification and GitHub handoff-sync rule

**Feature/task:** Verify the applied Timeline refinement bundle and clarify how the handoff must be synchronized with GitHub.

**Contributor-reported changes and results:**
- The contributor applied `grid_timeline_refinement.zip` in the local GRID repository, replacing the Timeline pilot's `App.jsx`, `timeline.css` and root `AI_HANDOFF.md`.
- The contributor ran `npm run build` from `react-pilot`.
- Vite 8.3.7 reported 18 modules transformed and completed the production build successfully in 255 ms.
- Reported output: `dist/index.html` 0.54 kB (0.34 kB gzip), CSS 29.16 kB (6.80 kB gzip), JavaScript 241.39 kB (74.88 kB gzip).
- This confirms the production bundle compiles. It does not confirm the refined modal's browser interactions or responsive behavior; those still require manual retesting.

**Contributor clarification / decision:**
- The contributor clarified that updating `AI_HANDOFF.md` locally is not enough. Every meaningful Timeline update must also be published to GitHub on `feature/Timeline`, even when the implementation code itself is staying local and is not being pushed.
- For a handoff-only synchronization, publish a documentation-only commit to `feature/Timeline` containing the updated `AI_HANDOFF.md`; do not push unapproved local implementation files.
- When Timeline code is later authorized for publication, include the updated `AI_HANDOFF.md` in the same code commit. Never push to `main` as part of this assignment.
- Continue updating the local handoff at the end of every meaningful session and sync that copy to `feature/Timeline`.

**Files changed locally in this session:**
- `AI_HANDOFF.md`

**Working currently:**
- The contributor-confirmed local `npm run build` succeeds after applying the refinement bundle.
- Earlier reported manual checks of the initial pilot remain valid: Timeline display, details view, filters, admin preview, event creation, multiple photos, local persistence and basic editing/deletion worked. The edit-in-page positioning complaint prompted the modal refinement.

**Testing performed and actual results:**
- Production build: PASS, based on contributor-provided terminal output (Vite 8.3.7, 18 modules, 255 ms).
- The refined modal's actual browser behavior, keyboard/focus behavior, save/cancel handling, mobile layout and visual/motion quality have not yet been reported as retested.
- No Timeline implementation code is being published by this handoff-only synchronization.

**Known limitations / incomplete work:**
- Browser-local IndexedDB is not shared with other users/devices and is not production content storage.
- The admin preview control is not real authentication; connect the real main-site admin permission and approved shared API before deployment.
- Demo milestones remain placeholders pending real GRID content and photo verification.
- Hook behavior in the contributor's actual clone still needs its block/pass test.

**Next:**
- Sync this current `AI_HANDOFF.md` to the remote `feature/Timeline` branch as a handoff-only commit.
- Ask the contributor to re-test the modal and new visual treatments in the browser, including mobile/responsive behavior.
- Keep the handoff synchronized to GitHub after each meaningful Timeline update; do not push local implementation code unless specifically authorized.

**Run/test:**
- From repository root: `cd react-pilot`, `npm run dev`.
- Production build: `npm run build` from `react-pilot` (most recent contributor-reported result: PASS, Vite 8.3.7, 18 modules, 255 ms).
- No implementation files are published as part of this handoff-only sync.


### Session 005 — Timeline admin validation, delete recovery and modal accessibility (local only)

**Feature/task:** Strengthen the Timeline-only milestone authoring workflow and add automated tests for the validation rules.

**Why:**
- The user asked to continue Timeline work while repository-owner permissions prevent GitHub publishing.
- The previous editor relied mainly on browser-native required fields and accepted broad `image/*` uploads.
- Deleting a milestone required confirmation but offered no recovery action after deletion.
- The event-detail dialog needed clearer keyboard focus management.

**Changes made:**
- Extracted milestone and image rules into `react-pilot/src/timelineValidation.js` so they can be tested separately from React UI.
- Added validation for title, allowed category, real calendar date, valid 24-hour time, card summary, full description, field length limits, photo count, supported raster image types, per-photo size and combined photo size.
- Limited accepted photos to JPEG, PNG, WebP, GIF and AVIF; SVG and other formats are rejected in the browser UI. The input advertises the same accepted types.
- Set a limit of 8 photos per milestone, 10 MB per photo and 40 MB combined per milestone. Full descriptions are limited to 6,000 characters.
- Added an actionable save error inside the editor when IndexedDB writes fail; quota and browser-storage errors now receive more useful messages. Editing fields or changing the photo selection clears the previous save error.
- Added an Undo delete action after a confirmed deletion. The restore writes the milestone back to IndexedDB and returns the timeline to unfiltered view. The undo is intentionally session-local and does not survive a refresh.
- Added focus placement and a keyboard focus loop to the event-detail modal, plus focus restoration and scroll locking on close.
- Added 10 unit tests with Node's built-in test runner and an `npm test` script.
- Updated the README with validation limits and test instructions.

**Files modified in the local working copy:**
- `react-pilot/src/App.jsx`
- `react-pilot/src/timeline.css`
- `react-pilot/src/timelineValidation.js` (new)
- `react-pilot/src/timelineValidation.test.js` (new)
- `react-pilot/package.json`
- `react-pilot/README.md`
- `AI_HANDOFF.md`

**Working currently:**
- The earlier production build was reported PASS by the contributor after Session 004 (Vite 8.3.7, 18 modules, 255 ms). That result does not cover Session 005 changes.
- The validation module is independently testable without additional dependencies.
- Undo delete and save-error presentation are implemented in the React UI, pending local browser testing.
- The existing IndexedDB repository adapter remains the storage mechanism for this browser-only pilot; no shared API or authentication has been added.

**Testing performed and actual results:**
- `node --test src/timelineValidation.test.js`: PASS, 10 tests, 0 failures.
- TypeScript transpile parser accepted `main.jsx`, `App.jsx`, `timelineRepository.js`, `timelineValidation.js` and `timelineValidation.test.js` with no syntax diagnostics.
- The earlier pre-commit hook block/pass test from Session 003 remains recorded; it was not rerun in this session.
- A fresh Vite production build was not run in this environment after Session 005 changes. Contributor should run `npm test` and `npm run build` locally.
- New modal focus behavior, image validation, storage-quota feedback and Undo delete still need manual browser verification on the contributor's Mac.

**Known errors / limitations / incomplete work:**
- Admin preview remains a UI-only switch, not authentication.
- IndexedDB data and images are stored only in the current browser/device; they are not shared with other visitors or admins.
- The app still needs the main site's approved authenticated admin permission and shared API before production.
- Demo milestones are not real GRID history and must be replaced with content verified by the team.
- New UI changes have not yet been browser-tested by the contributor.
- GitHub handoff synchronization remains blocked by repository-owner GitHub App/branch permissions. Do not claim the remote handoff is updated until the owner enables the required access and the remote file/commit is verified.
- No files have been committed or pushed to GitHub in this session.

**Next:**
1. Apply the supplied Timeline-only refinement bundle locally.
2. Run `npm test` and `npm run build` from `react-pilot`.
3. In the browser, test invalid date/time, disallowed image formats, photo-size limits, successful save, storage persistence, delete and Undo delete.
4. Check event-detail modal keyboard focus, Escape close and focus restoration.
5. Keep `AI_HANDOFF.md` updated after every meaningful session, including local-only sessions. Once repository-owner permissions are corrected, synchronize the handoff to `feature/Timeline`; do not push implementation code without explicit authorization.

**Run/test:**
- From repository root: `cd react-pilot`.
- Start preview: `npm run dev`.
- Run validation tests: `npm test` (Node built-in test runner; no extra package needed).
- Build production assets: `npm run build`.
- The app uses browser-local IndexedDB; do not treat this data as shared production content.

### Session 006 — Contributor verification of admin quality pass (local only)

**Feature/task:** Record the contributor's local automated test and production build results for the Session 005 Timeline admin quality pass, then guide the remaining browser-level checks.

**Contributor-reported changes and results (10 November 2026):**
- The contributor extracted `grid_timeline_admin_quality_pass.zip` into the local `grid_website` repository.
- From `react-pilot`, the contributor ran `npm test`.
- Node's built-in test runner reported all 10 milestone validation/storage-message tests passing, with 0 failures, 0 skipped and 0 cancelled (48.05875 ms total).
- The contributor then ran `npm run build`.
- Vite 8.3.7 transformed 19 modules and completed the production build successfully in 76 ms.
- Reported output: `dist/index.html` 0.54 kB (0.33 kB gzip), CSS 29.77 kB (6.90 kB gzip), JavaScript 244.92 kB (75.83 kB gzip).

**What works currently (verified):**
- Automated validation suite: PASS, 10/10.
- Vite production compilation: PASS, Vite 8.3.7, 19 modules, 76 ms.
- These results verify the test module and production compilation. They do not by themselves verify browser behavior for the new validation UI, Undo delete, keyboard focus behavior or actual IndexedDB photo operations.

**Files changed in this handoff update:**
- `AI_HANDOFF.md` only.

**Tests performed and actual results:**
- `npm test`: PASS, 10 tests, 0 failures, 0 skipped, 0 cancelled.
- `npm run build`: PASS, Vite 8.3.7, 19 modules, 76 ms.
- Browser runtime checks for the Session 005 changes are still pending contributor confirmation.

**Known limitations / incomplete work:**
- The admin preview switch is not real authentication.
- IndexedDB storage is local to the current browser/device and is not shared with other administrators or visitors.
- Demo milestones are placeholders and must be replaced with real, team-verified GRID history and photos before production.
- GitHub handoff publishing remains blocked by repository-owner GitHub App/branch permissions. The owner has disabled the relevant write permission and the contributor cannot change it. Do not claim that this handoff has been published remotely.
- No Git commit or push has been performed for Session 006.

**Next browser checks (run locally):**
1. Start the app from `react-pilot` with `npm run dev` and open the localhost URL Vite prints (normally `http://localhost:5173/`).
2. Enable **Admin preview** and click **Add milestone**. Confirm the editor opens as an overlay and can be closed with Cancel or Escape.
3. Try an impossible date (for example 31 February), malformed time, blank required fields and an overlong description. Confirm useful validation messages appear and the milestone is not saved.
4. Try an SVG or other unsupported file, 9 photos, a photo larger than 10 MB, and a combined photo set over 40 MB. Confirm each invalid selection is rejected. Use a few small JPG/PNG/WebP files for the valid case.
5. Add a valid milestone with a title, supported category, real calendar date, 24-hour time, summary, full description, location and 2 small photos. Save; confirm it appears in chronological order and opens in the detail dialog.
6. Edit that milestone; change a field, keep one existing photo, add another small photo, save, and confirm the updated information/photos remain.
7. Delete the test milestone using the detail dialog's delete action, confirm the browser prompt, then use **Undo delete** in the notification and confirm the milestone returns.
8. Refresh the page and confirm the saved milestone and photos remain in the same browser profile (IndexedDB persistence).
9. Keyboard check: open a detail dialog, use Tab and Shift+Tab to confirm focus stays in the dialog, press Escape to close, and confirm focus returns to the triggering card. Repeat for the editor.
10. Resize to mobile width and inspect card layout, detail dialog and editor scrolling.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Automated validation tests: `npm test` (most recent contributor-reported result: PASS, 10/10).
- Production build: `npm run build` (most recent contributor-reported result: PASS, Vite 8.3.7, 19 modules, 76 ms).
- Browser preview: `npm run dev`; open the URL printed by Vite.
- This remains a local-only Timeline pilot. Do not publish implementation code or the handoff to GitHub until repository-owner permissions are enabled and the push is authorized/possible.


### Session 007 — Mobile access, responsive design and ambient motion (local only)

**Feature/task:** Improve phone access and responsive usability, address the editor modal crop/auto-scroll behavior, unify component sizing and interactions, and add a more dynamic background without touching shared site-wide CSS or other website sections.

**Changes made and why:**
- The Vite dev server previously listened only on localhost by default, which prevents a phone on the local network from reaching the Mac preview. The dev script and Vite config now bind to `0.0.0.0` for same-Wi-Fi device testing.
- The editor previously autofocuses the title input on every device. On touch devices this can force the software keyboard and auto-scroll the modal under its sticky heading. The editor now focuses its close control on coarse-pointer devices and uses `preventScroll` for desktop first-field focus.
- Added a dedicated fixed ambient layer with three slow-moving crimson/plum light fields and subtle grain. Animation is disabled for users who request reduced motion.
- Added a mobile full-screen editor surface with safe-area padding, internal touch scrolling, a sticky header and sticky action row. The event detail dialog becomes a bottom sheet on smaller screens.
- Improved mobile year-filter horizontal scrolling, card spacing, touch targets, form input sizing, photo grid and details layout. Active year buttons now expose `aria-pressed` state.
- Updated README with same-Wi-Fi phone access instructions and local-network/firewall troubleshooting.

**Implementation details:**
- The implementation remains React + Vite and imports the repository-root `style.css` before Timeline-specific CSS.
- Vite's dev server binds to `0.0.0.0`; on the phone use the `Network` URL printed by Vite or `http://<Mac-Wi-Fi-IP>:5173/`, not `localhost`.
- Ambient motion is CSS-only, uses transform-based keyframes, and respects `prefers-reduced-motion`.
- Mobile modals use dynamic viewport units (`dvh`) and safe-area insets for iOS devices.
- No public hosting, production admin authentication, shared API or cross-device database has been added. The Vite network URL is a temporary development preview for devices on the same trusted LAN/Wi-Fi.

**Files modified in the local working copy:**
- `react-pilot/src/App.jsx`
- `react-pilot/src/timeline.css`
- `react-pilot/package.json`
- `react-pilot/vite.config.js`
- `react-pilot/README.md`
- `AI_HANDOFF.md`

**Working currently:**
- The previously contributor-verified automated milestone validation suite remains PASS (10/10) from Session 006.
- The previously contributor-verified Vite production build remains PASS (Vite 8.3.7, 19 modules, 76 ms) from Session 006.
- Phone preview access is now configured in the code but must be verified from the contributor's actual phone and Mac network.
- Mobile editor/detail modal layout, focus behavior, ambient animations and responsive filters are implemented but have not yet been tested in a live browser/device by the contributor.

**Testing performed and actual results:**
- `node --test src/timelineValidation.test.js`: PASS, all 10 tests, 0 failures.
- TypeScript transpile parser check for `src/App.jsx`: PASS, no syntax diagnostics.
- PostCSS parser check for `src/timeline.css`: PASS.
- The previous contributor-reported Vite production build in Session 006 (Vite 8.3.7, 19 modules, 76 ms) predates this session and does not verify these edits.
- A fresh dependency install, Vite production build and full browser/device test were not performed in this environment. Contributor should run `npm run build` and verify the Vite `Network` URL on a phone sharing the same Wi-Fi as the Mac.

**Known issues / limitations / incomplete work:**
- A phone cannot open `http://localhost:5173/` because localhost refers to the phone itself. It must use the Mac's LAN IP and both devices must be on the same Wi-Fi. Guest Wi-Fi/client isolation, macOS Firewall or VPN may block access.
- The local Vite server is not an internet-hosted public website. Do not expose this development server on public/untrusted networks.
- Browser-local IndexedDB is still device/browser-specific; phone and Mac data do not synchronize. Admin preview is not authentication.
- The existing shared `style.css` was intentionally not modified.
- GitHub handoff synchronization remains blocked by repository-owner write permissions. No Git commit or push has been performed.

**Next:**
1. Apply this Timeline-only update to the contributor's local repo.
2. From `react-pilot`, run `npm test` and `npm run build`.
3. Run `npm run dev`; note the Vite Network address.
4. From the Mac, run `ipconfig getifaddr en0` if needed to identify its Wi-Fi IP.
5. On a phone connected to the same trusted Wi-Fi, open `http://<Mac-Wi-Fi-IP>:5173/`.
6. Test mobile timeline layout, year/category filters, card details bottom sheet, full-screen admin editor, image picker, save/edit/delete, touch scrolling and keyboard/focus behavior.
7. Report any viewport-specific clipping or connection failure with the phone/browser model and copied error text.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Automated tests: `npm test`.
- Production build: `npm run build`.
- Start LAN-accessible development preview: `npm run dev` (now binds to `0.0.0.0`).
- On same trusted Wi-Fi, open the printed `Network` URL or `http://<Mac-Wi-Fi-IP>:5173/` on phone. Get the Mac IP with `ipconfig getifaddr en0`.
- Stop server with `Ctrl+C`. This remains a local-only preview, not public deployment.

### Session 008 — Unified liquid-glass design, pointer-reactive atmosphere and layout QA (local only)

**Feature/task:** Respond to contributor feedback that the previous ambient background was not apparent or interactive, visual styles were inconsistent, some text/controls appeared to overlap or collapse into vertical ovals, and the liquid-glass treatment needed improvement.

**Changes made and why:**
- Replaced the accumulated Timeline CSS refinement layers with one consolidated, page-scoped stylesheet. The prior CSS had several repeated selectors and overlapping media-query overrides, which made control sizing, modal layout and responsive behavior difficult to reason about consistently.
- Added an explicit mouse-reactive ambient light field. Desktop pointer movement updates CSS custom properties directly (without a React state update), moving a soft light gradient behind the page and slightly shifting the ambient fields. On touch devices, slow atmospheric movement remains active while pointer-follow behavior is disabled.
- Increased the visibility and depth of the three crimson/plum ambient fields, with a grain layer and restrained grid texture.
- Added a consistent liquid-glass surface treatment with layered translucent fills, a gradient border, top specular highlight, stronger backdrop blur and saturation, and restrained inset/depth shadows.
- Applied the shared glass treatment to timeline cards, year/category filters, preview controls, admin action surface, event editor/detail dialogs, upload panel and photo tiles.
- Standardized text controls (buttons, filter pills, admin toggle, upload control and undo action) around a horizontal capsule shape and 44px minimum touch height. Icon-only close/remove controls remain circular by design. Form buttons have explicit flex sizing and narrow-screen stacking to avoid squeezed vertical pills.
- Rebuilt responsive rules at 900px, 760px, 430px and 360px, including safe-area modal sizing, filter scrolling, card text wrapping, form grid behavior and action-button layout.
- Reworked the editor dialog as a fixed heading plus an independently scrolling form, preventing sticky header/form overlap and keeping actions reachable.
- Added `timelineDesign.test.js` and expanded the npm test script so the visual-system constraints have regression checks.

**Implementation details:**
- React pointer listener is attached to `window` only when `(pointer: fine)` matches. It uses `requestAnimationFrame` and CSS variables on the ambient layer to avoid re-rendering the app during pointer movement.
- Ambient layers use transform/translate animations and a pointer-local radial gradient. `prefers-reduced-motion` disables ambient and interface motion.
- Styling remains exclusively in `react-pilot/src/timeline.css`; the shared repository-root `style.css` was not changed.
- Repeated CSS patch blocks were removed from the Timeline stylesheet. The updated stylesheet contains one rule per selector per cascade context; media-query-specific overrides remain intentionally defined in their own contexts.

**Files modified in the local working copy:**
- `react-pilot/src/App.jsx`
- `react-pilot/src/timeline.css`
- `react-pilot/src/timelineDesign.test.js` (new)
- `react-pilot/package.json` (test script now runs all `src/*.test.js` files)
- `AI_HANDOFF.md`

**Working currently (verified in this environment):**
- Automated validation + design-regression tests: PASS, 17/17.
- JSX/TSX parser/transpile check for `App.jsx`: PASS, zero diagnostics.
- PostCSS parser check for `timeline.css`: PASS, 214 top-level nodes.
- Selector audit: zero duplicate selectors within the same cascade context.
- Pointer handler, pointer-follow CSS variables, liquid-glass filters/highlight/borders, common pill dimensions, mobile breakpoints, reduced-motion fallback and editor scroll structure are covered by design-regression tests.

**Testing performed and actual results:**
- `npm test`: PASS, 17 tests, 0 failures, 0 skipped, 0 cancelled.
- TypeScript JSX transpile parser: PASS, 0 diagnostics.
- PostCSS parse: PASS.
- Same-context duplicate selector audit: 0 duplicates.
- Full Vite production build was NOT run here. An online `npm install` timed out, and `npm install --offline` could not find the Vite plugin package in this environment's npm cache (`ENOTCACHED`). The contributor's Mac already has project dependencies installed; run `npm test` and `npm run build` locally.
- A headless Chromium viewport sweep was prepared for widths 1920, 1440, 1024, 900, 768, 760, 430, 414, 390, 375, 360 and 320px, but browser navigation was blocked on the initial page load with `ERR_BLOCKED_BY_ADMINISTRATOR`. No viewport in the sweep actually ran. Therefore no browser-rendered screenshot, computed layout, pointer interaction or real-device visual result is claimed as verified. The QA fixture used for the attempted stylesheet-only viewport checks is not part of the delivery package.

**Known issues / limitations / incomplete work:**
- Contributor must visually verify the new background is visible and follows the mouse in a desktop browser. Pointer movement is deliberately not enabled on touch devices; phones receive the ambient animation, not a mouse-follow effect.
- Contributor must retest text wrapping, pill orientation/width, modal editor, event cards and phone layouts at the listed widths on actual browsers. The static design tests do not replace browser visual QA.
- Full Vite build remains pending after the current stylesheet/component update because dependency installation could not complete in this environment.
- The preview continues to use IndexedDB local to each browser/device; it is not shared storage. Admin preview is still not authentication.
- GitHub handoff publishing remains blocked by repository-owner write permissions. No Git commit or push was performed.

**Next:**
1. Extract the delivered Timeline-only ZIP into the existing `grid_website` repository root, replacing the listed files only.
2. From `react-pilot`, run `npm test` (expected test count: 17) and `npm run build`.
3. Run `npm run dev` and check the mouse-reactive gradient on desktop. Move the mouse from the hero to the bottom of the page and verify the light follows smoothly without affecting clicks or causing page stutter.
4. Check the capsule controls at 1440px, 1024px, 768px, 430px, 390px and 360px. Confirm no text overlaps and no text action becomes a narrow vertical oval. Icon-only close/remove actions are intentionally round.
5. Open the editor and detail modal; verify the editor header remains separate from the scrolling form and the Save/Cancel controls remain accessible.
6. Repeat the same checks on a real phone. Verify the animated background is still visible and the page has no horizontal overflow.
7. Report any remaining specific control/viewport issue with the width and browser so it can be corrected precisely.
8. Keep updating this handoff after every meaningful local development or QA session, even if nothing is pushed. Publish the updated handoff to `feature/Timeline` once the repository owner restores the needed permission.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Automated validation and design regression: `npm test` (17 tests).
- Production build: `npm run build`.
- Local LAN dev preview: `npm run dev`; on desktop use the `Local` URL, and on a phone connected to the same trusted Wi-Fi use the `Network` URL or `http://<Mac-Wi-Fi-IP>:5173/`.
- For Mac Wi-Fi IP: `ipconfig getifaddr en0`.
- Stop Vite using `Ctrl+C`. This is still a local preview, not public deployment.

### Session 009 — GRID design-system alignment pass (local only)

**Feature/task:** Cross-check the Timeline pilot against the public GRID repository's owner-provided design system and align Timeline styling without changing shared/site-wide files.

**Scope confirmation:** Timeline only. No Home, About Us, Core Team, Events/Event Archive, FAQ, Contact, navbar, footer, shared admin dashboard, shared stylesheet, or other team's files were changed.

**Repository sources checked read-only:**
- Public `main` branch `style.css`: `https://github.com/adithadshetty3-dotcom/grid_website/blob/main/style.css`.
- Public `main` branch `contact.css` and `background.js`.
- Public `feature/FAQ` branch `FAQ/FAQ.css` and `FAQ/FAQ.html`.
- Public `feature/core-team` branch `team.css`, `team.html`, and `team.js`.
- Public `feature/Timeline` tree and branch reference.
- Public repository root and branch list.

**Owner design tokens confirmed:**
- `--bg-void: #0A0A0C`.
- `--bg-surface: #121215`.
- `--accent: #D81E3F`.
- `--accent-dim: #7A0F22`.
- `--text-primary: #F2EFEA`.
- `--text-muted: #8A8690`.
- `--font-display: 'Space Grotesk', sans-serif`.
- `--font-body: 'Inter', sans-serif`.
- Shared glass tokens `--glass-fill` and `--glass-border`.
- Shared shape tokens `--radius-sm: 6px`, `--radius-md: 12px`, `--radius-lg: 20px`.

**Changes made and why:**
- Removed purple/plum ambient color values from Timeline lighting. Ambient fields now use only the official crimson accent, deep crimson accent and their translucent blends.
- Reworked the Timeline token block so component tokens derive from shared GRID variables instead of introducing a separate palette or font system.
- Improved liquid-glass surfaces using the shared `--glass-fill` and `--glass-border`, with off-white highlights based on `--text-primary` and crimson reflected edges based on `--accent`.
- Standardized action buttons, admin toggle, upload action and undo action to the shared GRID small radius (`--radius-sm`) and a 44px minimum interaction height.
- Reserved 999px capsule geometry for year/category filter chips and the small event category label. Cards and form surfaces now use the shared medium/large radii. Icon-only close/remove controls remain circular intentionally.
- Replaced one-off red text shades with the official `--accent` or `--text-primary`; replaced alternate muted text, dark surface and background shades with shared tokens or transparent variations of those tokens.
- Scoped every page-specific selector (including media-query selectors) under `.timeline-shell`; moved Timeline-specific custom properties onto that root. Removed the unused global `body.timeline-modal-open` CSS hook and its redundant class toggles. Dialogs still lock and restore body scrolling through their existing modal lifecycle.
- Preserved the required import order: `main.jsx` imports repository-root `style.css` before `timeline.css`.
- Kept the shared repository-root `style.css` unchanged and excluded it from the update package.

**Implementation details:**
- Mouse-follow ambient pointer remains desktop-only and uses CSS custom properties updated through `requestAnimationFrame`; three ambient fields continue their slow motion on touch devices.
- `prefers-reduced-motion` behavior remains in place.
- Liquid-glass reflection and translucency use off-white, shared glass values and crimson only; no purple palette or separate font stack remains.
- Owner-standard action controls use `--tl-button-radius: var(--radius-sm)`; chips use `--tl-pill-radius: 999px`; card surfaces use `--tl-card-radius: var(--radius-md)`.

**Files modified locally:**
- `react-pilot/src/timeline.css`.
- `react-pilot/src/App.jsx` (removed redundant global modal-open body class toggles; retained the existing inline scroll lock and restoration).
- `react-pilot/src/timelineDesign.test.js` (expanded alignment, selector-scope, typography and palette regression checks).
- `AI_HANDOFF.md`.

**Working currently (verified in this environment):**
- Timeline validation and design regression suite: PASS, 20/20.
- JSX transpile/parser check: PASS, zero diagnostics.
- PostCSS stylesheet parser: PASS.
- Structured selector audit: 335/335 non-keyframe selectors are scoped beneath `.timeline-shell`; zero unscoped selectors.
- Palette audit: no purple/violet values or alternate red hex accent shades remain in Timeline CSS.
- Shared style import order and inherited owner fonts are covered by tests.

**Testing performed and actual results:**
- `npm test`: PASS, 20 tests, 0 failures, 0 skipped, 0 cancelled.
- TypeScript JSX transpile parser for `App.jsx`: PASS, 0 diagnostics.
- PostCSS parse of `timeline.css`: PASS (288 non-keyframe rule nodes in the audit).
- Scope audit: PASS, all 335 selector entries scoped to `.timeline-shell`.
- No fresh Vite production build or real-browser viewport sweep was run in this environment because this working container does not have the project's local Vite dependencies installed and browser navigation is not available here. The contributor's Mac has previously built the project successfully; rerun `npm run build` there after applying this update.
- This stylesheet contains repeated selector appearances where shared declarations are grouped and later component/state/media rules add their own declarations. The previous Session 008 blanket statement that there were zero repeated selectors was too broad; the current audit confirms scoping and token alignment rather than claiming that every selector appears only once.

**Known issues / limitations / incomplete work:**
- Visual appearance still needs confirmation in the contributor's local desktop and phone browsers. Automated string/syntax checks cannot prove the exact rendered blur, lighting strength, or absence of viewport-specific text wrapping issues.
- The owner-provided shared design system remains the source of truth. Do not edit root `style.css` without explicit team-owner coordination.
- Admin preview is still not real admin authentication. IndexedDB remains local to each browser/device and is not synchronized across phones/computers.
- GitHub publishing of the updated handoff remains blocked by repository-owner write permissions. No commit, push, PR, or remote file modification was performed.

**Next:**
1. Apply this ZIP to the existing local `grid_website` repository root; it contains only the listed Timeline files and the handoff.
2. From `react-pilot`, run `npm test` (expected: 20/20) and `npm run build`.
3. Run `npm run dev` and compare the Timeline against another GRID page: verify same Space Grotesk/Inter, charcoal/crimson/off-white palette, shared radius language and liquid-glass treatment.
4. On desktop, move the pointer across hero, cards and lower sections; verify the crimson light follows smoothly without stutter or blocking interactions.
5. On phone, check 360–430px widths, year/category filters, card title wrapping, modal sheet corner treatment, full-screen editor, form controls and photo tiles. Confirm no horizontal overflow or text overlap.
6. Report specific remaining visual issues with viewport width and browser. Do not claim browser/phone QA complete until those checks have actually been performed.
7. Keep updating this handoff after every meaningful local development or QA session, even with no push. Publish the updated handoff to `feature/Timeline` once repository-owner write permission is restored.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Automated validation + design regression: `npm test` (20 tests).
- Production build: `npm run build`.
- Start LAN-accessible local preview: `npm run dev` (Vite binds to `0.0.0.0`).
- Desktop uses the `Local` URL. Phone must use the printed `Network` URL or `http://<Mac-Wi-Fi-IP>:5173/` while on the same trusted Wi-Fi. Mac IP: `ipconfig getifaddr en0`.
- Stop Vite with `Ctrl+C`. This remains a development preview, not public hosting.

### Session 010 — Restore subtle GRID atmosphere, natural glass and mobile dialog behavior (local only)

**Date:** 10 November 2026.

**Feature/task:** Respond to the contributor's desktop and mobile screenshots. Feedback identified an overly strong cursor-following blob, a flat/non-dynamic-feeling background, forced and red-tinted glass surfaces, spacing/metadata collision in event details, and a mostly non-working phone layout.

**Scope confirmation:** Timeline only. No shared stylesheet, Home, About Us, Core Team, Events/Event Archive, FAQ, Contact, navbar, footer, shared admin dashboard, deployment configuration or other group's files were changed.

**Changes made and why:**
- Removed the three large, strongly blurred ambient orbs and the broad cursor-following radial spotlight. These effects were too visually dominant and looked like a blob being dragged around the page.
- Added a lightweight animated particle network inspired by the owner's existing `background.js`: subtle off-white nodes connected by thin maroon lines. It animates on desktop and phones. Desktop mouse movement only gently influences nearby particles and slightly brightens nearby network connections; it does not draw a spotlight, blob or large gradient around the cursor.
- Capped the canvas device-pixel ratio at 1.5 and uses responsive particle counts (20–34 on phones, 34–66 on desktop) to keep rendering bounded. Animation pauses when the document is hidden and respects `prefers-reduced-motion`.
- Replaced the heavy crimson-tinted liquid-glass gradients and strong blur with a quieter smoked-glass treatment: neutral translucent white/charcoal surface, shared glass border, 18px blur at 118% saturation, subtle off-white top reflection and softer shadow. No purple/plum tones, unrelated fonts or new brand colours were introduced.
- Removed the strong red gradient from placeholder-photo surfaces so empty cards do not appear flooded with red light.
- Fixed a specific event-detail layout defect shown in the screenshot: the demo-content tag and category/date metadata used to sit on the same unstructured line. They now occupy a wrapping `.detail-kicker-row`, with space reserved for the close button; long milestone titles use a more controlled type scale and line wrap.
- Made the event-detail dialog a constrained column with an independently scrollable content area. On mobile it becomes a bottom sheet with a bounded photo region, two-column facts (one column on very narrow screens), safe-area spacing and full-width admin actions.
- Rebuilt the mobile editor layout as a true viewport-height panel with an independently scrolling form, stable heading and sticky Save/Cancel actions. Form fields, upload control and photo tiles use one-column/two-column mobile grids with `min-width: 0` to avoid squeezed controls and horizontal overflow.
- Removed `overflow: clip` from the main Timeline shell because clipping ancestors can interfere with fixed mobile dialogs. The mobile layout now uses one consolidated responsive rule set at 900px, 760px, 430px and 360px rather than keeping competing older mobile overrides.
- Changed backdrop dismissal from `onMouseDown` to `onClick`, which is more appropriate for touch interaction and continues to dismiss only when the user taps the backdrop itself.
- Reworked the QA regression suite to validate the particle-network design, reduced-motion behavior, calmer glass treatment, wrapping event metadata, mobile dialog/form scrolling, tap-compatible backdrops and official GRID palette.

**Implementation details:**
- The ambient canvas is created inside the Timeline's decorative `timeline-ambience` layer. Pointer movement updates a small target position; particles near that target receive a capped, low-force adjustment. No React state changes are triggered by pointer movement.
- Particle links use maroon `rgba(122, 22, 32, alpha)` and nodes use off-white `rgba(242, 239, 234, 0.22)`, with a restrained local crimson response. This follows the shared `background.js` visual language and the official `--accent` / `--accent-dim` palette.
- Liquid glass remains page-scoped in `timeline.css`; the repository-root `style.css` remains untouched and is still imported before Timeline CSS.
- Responsive CSS was consolidated so mobile modal/editor rules do not compete with a second appended set of overrides.
- Modal close/keyboard lifecycle, form validation and IndexedDB storage logic were otherwise retained.

**Files modified locally:**
- `react-pilot/src/App.jsx`.
- `react-pilot/src/timeline.css`.
- `react-pilot/src/timelineDesign.test.js`.
- `AI_HANDOFF.md`.

**Working currently (verified in this environment):**
- Automated validation and visual-regression suite: PASS, 24/24.
- TypeScript JSX transpile/parser checks for `App.jsx` and `main.jsx`: PASS, zero syntax diagnostics.
- PostCSS parse of `timeline.css`: PASS, 218 top-level nodes.
- Selector scope audit: PASS, all 288 selector rules are scoped under `.timeline-shell`; zero unscoped selectors.
- Exact-selector duplicate audit within the same cascade context: PASS, zero duplicate selectors.
- Responsive max-width breakpoints are consolidated to 900px, 760px, 430px and 360px.
- Old `.ambient-orb` and `.ambient-pointer` selectors/elements are removed. No purple/violet terms or colour values remain in Timeline CSS.

**Testing performed and actual results:**
- `npm test`: PASS, 24 tests, 0 failures, 0 skipped, 0 cancelled.
- TypeScript JSX transpile check: PASS, 0 diagnostics for both `App.jsx` and `main.jsx`.
- PostCSS parse: PASS.
- Selector audit: PASS, 288 scoped selectors, zero unscoped selectors, zero exact duplicate selectors within the same cascade context.
- Responsive breakpoint audit: PASS, one consolidated sequence at 900px, 760px, 430px and 360px.
- Full Vite production build was NOT verified in this container. `npm run build` could not start because this working container has no local `vite` binary; `npm install --no-audit --no-fund` timed out. Do not describe a Vite build as passed until it is run on the contributor's Mac.
- Attempted headless Chromium screenshots for desktop/tablet/phone and event/editor dialogs, but Chromium did not finish initial page rendering before the tool timeout. No screenshot, real browser computed layout, click/touch interaction or phone result is claimed as verified in this environment.
- The supplied desktop/tablet screenshots were visually inspected; they showed the metadata collision and over-strong red glass/background treatment addressed above. Actual verification of the new render remains pending on the contributor's Mac and phone.

**Known issues / limitations / incomplete work:**
- The new design and mobile dialog behavior still need local browser testing. Automated tests validate the structure and style rules, not actual rendered pixels or iOS/Android browser interaction.
- Run `npm test` and `npm run build` on the contributor's Mac. Existing local dependencies were installed successfully there earlier, but this exact Session 010 source has not yet been built on that machine.
- Then start `npm run dev`, confirm the Vite Network URL works on a phone on the same trusted Wi-Fi, and test the event details bottom sheet, full-screen editor, date/time controls, photo picker, year/category filters, save/edit/delete and horizontal overflow.
- The mouse response is intentionally subtle and desktop-only; mobile devices receive the continuously moving particle network without a cursor-follow effect.
- Browser-local IndexedDB remains device-specific and does not sync between Mac and phone. Admin preview remains a prototype switch, not real authentication.
- GitHub handoff publishing remains blocked by repository-owner write permissions. This session is local only; no commit, push, PR or remote file modification was performed.

**Next:**
1. Apply this Timeline-only update to the local `grid_website` repository root.
2. From `react-pilot`, run `npm test` (expected: 24/24) and `npm run build`.
3. Run `npm run dev`; verify the `Network` URL opens on a phone connected to the same trusted Wi-Fi.
4. On desktop, move the mouse slowly and confirm only the particle network responds subtly; there should be no moving blob, cursor spotlight or large ambient wash.
5. On desktop and phone, open the first and second milestone details. Check that the demo marker and category/date never overlap, the close button stays clear, the text has balanced spacing, and content scrolls inside the dialog.
6. On phone, open the admin preview and editor. Verify all inputs, date/time selectors, photo picker, removal buttons and sticky Save/Cancel actions are reachable and tappable; confirm no horizontal overflow at 360px, 390px and 430px.
7. Compare the glass treatment with other GRID pages. It should read as subtle smoked glass, not an opaque red panel or a thick artificial shine.
8. Report remaining issues by browser and viewport width. Do not claim visual QA complete until a real browser/device check passes.
9. Continue updating this handoff after every meaningful local development/QA session. Publish it to `feature/Timeline` once repository-owner write permission is restored.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Automated tests: `npm test` (24 tests).
- Production build: `npm run build`.
- Start local LAN-accessible preview: `npm run dev`.
- Desktop: use the printed `Local` URL. Phone: use the printed `Network` URL or `http://<Mac-Wi-Fi-IP>:5173/` with both devices on the same trusted Wi-Fi. On Mac, get the LAN IP with `ipconfig getifaddr en0`.
- Stop Vite with `Ctrl+C`. This remains a local development preview, not public hosting.

### Session 011 — General Timeline checkup: visible atmosphere, selective glass and editor layer separation (local only)

**Date:** 10 November 2026.

**Feature/task:** Respond to the contributor's general checkup feedback: the background still looked like a flat charcoal fill, the editor's lower content layer overlapped the action buttons/text in some places, and more liquid-glass surfaces were requested where visually appropriate.

**Scope confirmation:** Timeline only. No changes to the repository-root shared `style.css`, Home, About Us, Core Team, Events/Event Archive, FAQ, Contact, navbar, footer, overall admin dashboard, deployment settings or other groups' files.

**Changes made and why:**
- Made the Timeline background visibly dynamic without restoring the disliked cursor blob. Added three wide, low-contrast crimson/deep-crimson ambient fields that slowly drift across the page; the gradients are broad and diffuse rather than isolated moving spots. This remains within the owner's official palette.
- Increased the visibility and density of the owner's-inspired off-white particle / maroon connection network. Particle opacity and link opacity were raised from the prior nearly invisible levels; particle motion is slightly quicker while still subtle. Nearby desktop pointer movement only gently influences local particles and network links. There is no cursor spotlight or large pointer-following glow.
- Kept background motion efficient: canvas rendering is bounded by responsive particle-count limits and a device-pixel-ratio cap, pauses when the document is hidden, and has a `prefers-reduced-motion` fallback. The shell-level ambient gradient also stops for reduced-motion users.
- Fixed the editor stacking/overlap issue structurally rather than adding more z-index patches. The milestone form now contains a dedicated `.editor-form-scroll` viewport for fields, upload panel, photo previews and validation messages. Save/Cancel controls now sit in a separate non-scrolling `.form-actions` footer row. The footer participates in normal flex layout; it is no longer sticky over the content. The editor title/header remains a separate fixed-height flex sibling above the form.
- Reused the natural liquid-glass treatment selectively on year headings, event fact summaries and admin action groups, in addition to existing cards, filters, toolbar, upload panels and photo tiles. These new glass surfaces are limited to clear grouping points rather than applying glass to every control.
- Scoped the scroll-reveal `IntersectionObserver` query to the Timeline `<main>` via `shellRef`, rather than querying all matching elements in `document`. This avoids attaching Timeline reveal behavior to other groups' sections when the website is integrated.
- Left owner-defined typography, official colours, spacing/radius tokens, root `style.css` import order and CSS isolation unchanged.

**Implementation details:**
- Ambient gradients use only official crimson `#D81E3F`, deep crimson `#7A0F22`, charcoal and transparent layers. They are placed on `.timeline-shell::after`, beneath the fixed particle layer and page content.
- The canvas now draws 28–42 particles on phones and 42–78 on larger screens, with responsive link distances and off-white node opacity of 0.40. It uses maroon links and a very restrained crimson response near a desktop pointer.
- `.milestone-form` is now a non-scrolling flex column with `overflow: hidden`; `.editor-form-scroll` is `flex: 1 1 auto`, `min-height: 0` and independently scrollable; `.form-actions` is a non-sticky footer with `flex: 0 0 auto`. The same separation is retained at phone breakpoints.
- `.year-heading`, `.detail-facts` and `.detail-admin-actions` now receive the existing `.liquid-glass` treatment, with Timeline-specific padding and layout only.
- Scroll reveal targets are queried from `shellRef.current` to keep Timeline DOM behavior local to this section.

**Files modified locally:**
- `react-pilot/src/App.jsx`.
- `react-pilot/src/timeline.css`.
- `react-pilot/src/timelineDesign.test.js`.
- `AI_HANDOFF.md`.

**Working currently (verified in this environment):**
- Automated validation + design regression suite: PASS, 26/26 tests, 0 failures, 0 skipped, 0 cancelled.
- JSX transpile/parser check for `App.jsx` and `main.jsx`: PASS, zero diagnostics.
- PostCSS parse of `timeline.css`: PASS, 211 top-level nodes.
- CSS selector audit: 292 non-keyframe selector rules, all scoped under `.timeline-shell`; zero unscoped selectors.
- Exact selector duplicate audit within the same at-rule/cascade context: PASS, zero duplicate selectors.
- Editor structure check: independent scroll viewport and non-sticky footer are present; form action footer is outside the scroll viewport.
- Selective glass classes are present on the year heading, detail facts and detail admin actions.

**Testing performed and actual results:**
- `npm test`: PASS, 26 tests, 0 failures, 0 skipped, 0 cancelled.
- TypeScript JSX transpile check: PASS, 0 diagnostics for `App.jsx` and `main.jsx`.
- PostCSS CSS parse: PASS.
- CSS scope/duplicate audit: PASS, 292 scoped selector rules, zero unscoped selectors, zero duplicate selectors (keyframe step selectors excluded from the page-selector audit).
- Attempted `npm install --no-audit --no-fund --ignore-scripts` in this container, but it timed out. There is no local `node_modules` / Vite binary in this working container, so the Vite production build is NOT verified here. Do not describe it as passed.
- Attempted headless Chromium screenshot rendering at a desktop viewport with a local HTML fixture, but Chromium did not finish launching/rendering before the timeout. No browser screenshot, computed layout, real pointer interaction, touch, or phone result is claimed as verified in this environment.

**Known issues / limitations / incomplete work:**
- Actual rendered visibility and animation of the new ambient fields / particle network still need local verification on the contributor's Mac. The CSS and canvas implementation are present and statically checked, but browser output was not confirmed here.
- The editor footer/scroll separation is structurally fixed and automated tests pass, but real desktop and mobile scrolling, focus, keyboard, date/time controls, photo picker and saving still need to be checked in the contributor's browser.
- Run `npm test` and `npm run build` on the contributor's Mac after applying this update. The previous Session 010 source was applied locally, but this Session 011 code still needs its own production build verification on the Mac.
- Browser-local IndexedDB remains device-specific and does not sync between Mac and phone. Admin preview is a prototype switch, not real authentication; shared storage and authenticated admin permissions must be supplied by the main site's agreed backend.
- GitHub handoff publishing remains blocked by repository-owner write permissions. This session is local only; no commit, push, PR or remote repository modification was performed.

**Next:**
1. Apply this Timeline-only update to the local `grid_website` repository root.
2. From `react-pilot`, run `npm test` (expected: 26/26) and `npm run build`.
3. Run `npm run dev`; check both the local URL on Mac and Vite's Network URL on a phone connected to the same trusted Wi-Fi.
4. On desktop, confirm the background has visible but diffuse slow ambient movement and off-white/maroon particle connections; move the mouse to verify only a restrained local network response, not a blob or spotlight.
5. Open the admin editor on desktop and phone. Confirm the header remains above, fields/photos scroll in the middle, and Save/Cancel stay in a separate footer without covering the last field, validation message or photo tile.
6. Scroll through a long event form with multiple photos and a validation error; confirm every item can be reached without the footer covering it.
7. Open event details and check the glass facts strip and admin action surface. Check the year headings' new subtle glass treatment on both desktop and phone.
8. Verify viewport widths around 360px, 390px, 430px, 768px, 1024px and 1440px for horizontal overflow, text overlap, incorrect button geometry and dialog clipping.
9. Record any remaining browser/device-specific defects. Do not claim visual QA complete until real browser/device checks pass.
10. Continue updating this handoff after every meaningful local development/QA session. Publish it to `feature/Timeline` once repository-owner write permission is restored.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Automated tests: `npm test` (26 tests).
- Production build: `npm run build`.
- Start local LAN-accessible preview: `npm run dev`.
- Desktop: use Vite's printed `Local` URL. Phone: use the printed `Network` URL or `http://<Mac-Wi-Fi-IP>:5173/` with both devices on the same trusted Wi-Fi. On Mac, get the LAN IP with `ipconfig getifaddr en0`.
- Stop Vite with `Ctrl+C`. This remains a local development preview, not public hosting.

### Session 012 — Editor content sizing, viewport-anchored atmosphere and brighter star field (local only)

**Date:** 10 November 2026.

**Feature/task:** Respond to the contributor's two latest screenshots: the editor's photo-upload area/scrollbar appeared to intrude into the lower actions, and the background showed confusing red/charcoal horizontal transitions with only a few barely visible stars.

**Scope confirmation:** Timeline only. No changes to the repository-root shared `style.css`, Home, About Us, Core Team, Events/Event Archive, FAQ, Contact, navbar, footer, overall admin dashboard, deployment settings or other groups' files.

**Changes made and why:**
- Fixed editor content sizing so the form grid, photo-upload panel, photo preview grid and validation message cannot shrink underneath or visually collide with the separate Save/Cancel footer. These sections now keep their natural height and width inside the single scrollable content viewport.
- Added right-side breathing room inside the editor scroll viewport and changed its scrollbar to a narrow, low-contrast maroon thumb. This prevents the scrollbar from appearing to sit on top of the form controls or upload surface.
- Removed the page-length ambient gradient layer. Its absolute positioning on `.timeline-shell` meant the radial gradients were scaled against the full document height, making the red-to-charcoal transition change with page scroll and appear as horizontal bands.
- Added a dedicated `.ambient-glow` layer inside the fixed viewport-sized `.timeline-ambience`. The base remains the owner's charcoal `#0A0A0C`; the red appearance now comes only from low-opacity radial gradients using the official crimson `#D81E3F` and deep crimson `#7A0F22`. These broad gradients softly fade into charcoal and drift slowly. Their position is tied to the viewport, not the full page height, so the colour field no longer stretches into bands as the document grows or scrolls.
- Increased the off-white star/particle network to 52–72 points on phones and 86–136 on desktop-sized viewports. A small subset are brighter, slightly larger stars with restrained crimson-tinted halos; all stars softly twinkle. Maroon connection lines remain subtle and follow the shared GRID background direction.
- Reduced the mouse influence further: pointer proximity gently affects nearby particle velocity and slightly lifts nearby connection-line opacity. It no longer recolours a cluster of nearby particles crimson, avoiding the visible cursor/blob effect.
- Preserved mobile animation, viewport resizing, hidden-tab pause, device-pixel-ratio cap and `prefers-reduced-motion` fallback.

**Implementation details:**
- Added `<span className="ambient-glow" />` before the network canvas inside `.timeline-ambience`.
- Removed the document-sized `.timeline-shell::after` radial gradient and its old `tl-ambient-drift` keyframes. Replaced them with fixed-layer `.ambient-glow` gradients and the slow `tl-glow-drift-a` / `tl-glow-drift-b` transform animations.
- Canvas particles have individual brightness, phase and twinkle-rate properties. The drawing loop varies off-white particle opacity over time; the pointer response no longer changes particle fill to bright crimson.
- `.editor-form-scroll` now has extra inline-end padding and a 5px low-contrast WebKit scrollbar. Direct children `.form-grid`, `.upload-field`, `.editor-photo-grid` and `.form-error` use `flex: 0 0 auto`, `width: 100%`, `max-width: 100%`, `min-width: 0` and border-box sizing so the scrollport owns overflow rather than compressing content.
- The action footer remains a separate non-sticky flex sibling. Its background is nearly opaque charcoal instead of a bright floating overlay.

**Files modified locally:**
- `react-pilot/src/App.jsx`.
- `react-pilot/src/timeline.css`.
- `react-pilot/src/timelineDesign.test.js`.
- `AI_HANDOFF.md`.

**Working currently (verified in this environment):**
- Node built-in test suite: PASS, 27/27 tests, 0 failures, 0 skipped, 0 cancelled.
- TypeScript JSX parser checks for `App.jsx` and `main.jsx`: PASS, 0 parse diagnostics.
- PostCSS parse for `timeline.css`: PASS, 218 top-level nodes.
- CSS scoping audit: PASS, 0 page-specific selectors outside `.timeline-shell` (keyframe selectors excluded).
- Editor regression tests assert that the upload panel, form grid, photo grid and validation message are non-shrinking children of the scroll region, while actions remain outside that region.
- Background regression tests assert that ambient gradients live in the fixed viewport layer, use the official palette, and that the star network has responsive density, twinkle and a restrained pointer response.

**Testing performed and actual results:**
- `npm test`: PASS, 27 tests, 0 failures, 0 skipped, 0 cancelled.
- TypeScript JSX parser: PASS, `App.jsx` and `main.jsx` both report zero diagnostics.
- PostCSS CSS parser: PASS, 218 top-level nodes.
- CSS scope audit: PASS, all regular page selectors remain scoped under `.timeline-shell`; keyframe step selectors were excluded from the page selector audit.
- This working container does not have the React/Vite project's `node_modules`, so a fresh `npm run build` was not performed for Session 012. The contributor must run it in the local project after applying the bundle.
- No real browser screenshot/render, pointer, mobile, scrollbar or form interaction test was available in this environment. The exact two screenshots were inspected; the fixes target the visible causes, but their rendered result still requires contributor verification.

**Known issues / limitations / incomplete work:**
- The revised background's visual strength and gradient softness need to be checked in Chrome on the contributor's Mac and on the phone; brightness can be tuned after seeing the actual rendered result.
- The editor scroll gutter and non-shrinking content layout need a long-form manual test using multiple photos and a visible validation error, on both desktop and mobile.
- Production build verification after Session 012 is pending.
- Admin preview is not real authentication; the local IndexedDB/photo data remains device-specific and needs the main website's approved authenticated API and shared storage for deployment.
- GitHub handoff publishing is still blocked by repository-owner permissions. This update remains local; no commit, push, PR or remote repository change was performed.

**Next:**
1. Apply the Session 012 bundle to the contributor's local `grid_website` repository root.
2. From `react-pilot`, run `npm test` (expected 27/27) and `npm run build`.
3. Start `npm run dev` and inspect the same editor area from the first screenshot. Confirm the scrollbar is separated from the content and that the photo upload area and photo previews scroll above the action footer without overlap.
4. Add multiple photos and a validation error, then scroll to the bottom. Confirm the last photo, validation message and all controls remain reachable.
5. Check the background at the very top, mid-page and bottom. The charcoal base should remain consistent; the red tint should be a soft fixed radial atmosphere, not a horizontal colour band.
6. Check the star field on desktop and phone. It should have clearly visible off-white stars with a few brighter twinkles and muted maroon connections, while pointer movement remains subtle and never creates a red blob.
7. Check phone widths around 360px, 390px and 430px, plus desktop 1024px and 1440px. Record any remaining clipping/overlap by viewport and browser.
8. Continue updating this handoff after every meaningful local development/QA session. Publish it to `feature/Timeline` only after repository-owner write permissions are restored.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Automated tests: `npm test` (27 tests).
- Production build: `npm run build`.
- Start LAN-accessible local preview: `npm run dev`.
- Desktop: use Vite's printed `Local` URL. Phone: use the printed `Network` URL or `http://<Mac-Wi-Fi-IP>:<VITE-PORT>/` with both devices on the same trusted Wi-Fi. On Mac, get the LAN IP with `ipconfig getifaddr en0`. Vite may choose a different port if the default is occupied; use the exact port printed in Terminal.
- Stop Vite with `Ctrl+C`. This remains a local development preview, not public hosting.

### Session 013 — Star hover restoration, subtle motion trails, breathing gradient and adaptive rendering (local only)

**Date:** 10 November 2026.

**Feature/task:** Restore the earlier interactive star behaviour requested by the contributor; explore a restrained motion-blur treatment; make the charcoal/crimson background breathe slowly between darker and redder states; and reduce background rendering cost across phones, tablets and desktop devices.

**Scope confirmation:** Timeline only. No changes to repository-root `style.css`, other site pages, shared navigation/footer, other teams' files, overall admin dashboard, authentication, deployment or remote GitHub state.

**Changes made and why:**
- Restored the star-hover interaction: when a fine-pointer mouse or pen passes directly over an individual star (within an 18px radius), that single star changes from off-white to GRID crimson and fades back over approximately 2.2 seconds. The effect is attached to one detected star at a time, not a circular group around the pointer, so it avoids recreating the disliked cursor/blob effect.
- Added a small motion-trail treatment to brighter stars and temporarily highlighted stars. The trail is drawn as a short directional canvas stroke behind an individual point. This gives a restrained motion-blur impression without applying an expensive full-screen CSS blur filter to the background or page content.
- Replaced the mostly static ambient glow with a slow, continuously breathing background gradient. The permanent base remains the owner's charcoal `#0A0A0C`; broad crimson `#D81E3F` and deep-crimson `#7A0F22` radial fields fade toward charcoal over a 48-second cycle, while a second, lower-opacity layer countercycles over 66 seconds. The lighting stays viewport-fixed and does not create document-height colour bands.
- Optimized the particle renderer for different device capabilities. Particle density, canvas pixel ratio, link distance and draw rate now adapt to viewport size, `navigator.deviceMemory`, `navigator.hardwareConcurrency` and the browser's `saveData` preference.
- Replaced the previous all-pairs particle connection calculation with a uniform spatial hash. The algorithm groups stars into cells and only checks pairs in the same or adjacent cells, reducing unnecessary pair-distance calculations as the number of stars grows.
- Capped the animation draw rate to 45 FPS on normal desktop profiles, 30 FPS on normal phones, and 24–30 FPS on low-power profiles. Canvas pixel ratio is capped at 1.5 for normal desktops, 1.25 for normal phones and 1.0 for low-power profiles. The animation loop pauses while the document is hidden and remains static for users who request reduced motion.
- Added `content-visibility: auto` and an intrinsic-size hint to timeline year groups so off-screen groups can defer some rendering work in browsers that support it.
- Expanded two `:where(...)` selector groups into explicit `.timeline-shell`-scoped selectors so the CSS isolation audit can inspect every selector without misreading commas nested inside `:where()`.

**Implementation details:**
- Added `react-pilot/src/timelineBackground.js` with pure helpers: `getBackgroundProfile`, `getNearbyParticlePairs` and `getHighlightProgress`.
- `getBackgroundProfile` selects particle count, pixel-ratio cap, FPS and connection distance. Normal phone particle count is 34–48; low-power phone count is 24–34; normal desktop count is 62–96; low-power desktop count is 44–64.
- `getNearbyParticlePairs` uses a cell size equal to the maximum link distance and checks only adjacent cells. It returns each pair once and includes the computed distance for line-opacity calculation.
- `App.jsx` now marks the closest star within the hover radius for 2,200ms when the pointer enters a new star. The highlight progress interpolates the star from off-white toward crimson and fades its glow/trail back out. Moving over a different star can highlight that star independently.
- The pointer is not used to translate or pull a large field of particles. The only pointer-specific visual change is an individual star highlight; the star itself continues its slow drift.
- The star-trail stroke is drawn only for brighter or currently highlighted stars and has a short length derived from particle velocity. No large-area `filter: blur()` or CSS `backdrop-filter` was introduced for motion blur.
- `.ambient-glow` uses a charcoal base with two wide radial-gradient pseudo-elements. CSS keyframes `tl-gradient-breathe` and `tl-gradient-countercycle` modulate opacity/position slowly. The existing reduced-motion media query disables both animations.
- The canvas uses an alpha context with the optional `desynchronized` hint, caps device-pixel ratio, throttles drawing to the adaptive frame budget, and cancels/restarts its animation frame when tab visibility changes.
- The new code remains in the Timeline React pilot. No shared CSS or site-wide JavaScript is edited.

**Files modified locally:**
- `react-pilot/src/App.jsx`.
- `react-pilot/src/timeline.css`.
- `react-pilot/src/timelineBackground.js` (new).
- `react-pilot/src/timelineDesign.test.js`.
- `react-pilot/src/timelineBackground.test.js` (new).
- `AI_HANDOFF.md`.

**Working currently (verified in this environment):**
- Node built-in automated test suite: PASS, 37/37 tests, 0 failures, 0 skipped, 0 cancelled.
- New background helper tests cover low-power phone profiles, normal phone profiles, Save-Data preference, desktop profile caps, spatial-hash pair uniqueness/distance filtering, empty inputs and timed hover fading.
- Timeline design regression tests assert one-star crimson hover timing, subtle individual star trails, slow gradient breathing, responsive frame/pixel/particle settings and existing reduced-motion behaviour.
- TypeScript JSX transpile/parser checks: PASS, zero diagnostics for `App.jsx` and `main.jsx`.
- PostCSS parse: PASS, `timeline.css` parses successfully.
- CSS scoping audit: PASS after expanding comma-containing `:where()` groups; all regular page selector groups visibly begin with `.timeline-shell`. Keyframe step selectors are excluded from the page selector audit.

**Testing performed and actual results:**
- `node --test src/*.test.js`: PASS, 37 tests, 0 failures, 0 skipped, 0 cancelled.
- TypeScript transpile checks for `App.jsx` and `main.jsx`: PASS, 0 parse diagnostics.
- PostCSS parse of `timeline.css`: PASS.
- Selector review: page selectors are scoped under `.timeline-shell`; `:where()` groups were expanded to make the selector audit unambiguous.
- A Vite production build was NOT run in this working container because the React/Vite project's `node_modules` directory is absent here. The contributor must run `npm run build` on the Mac after applying the bundle.
- No real browser render, performance profile, device benchmark, reduced-motion preference test or phone interaction was run in this environment. The adaptive settings and algorithm are covered by unit/static tests; smoothness must still be verified on actual devices.

**Known issues / limitations / incomplete work:**
- Actual star-hover visibility and fade timing need desktop Chrome verification. The interaction is intentionally limited to mouse/pen; touch devices do not have hover and instead show drifting/twinkling stars.
- The gradient cycle should be viewed over a longer period to judge whether the slow red-to-charcoal breathing is noticeable but not distracting. The CSS cycle is intentionally slow (48s/66s), not a rapid flash.
- Motion trails are short and subtle; adjust their length/opacity only after seeing the actual browser render, not by adding a large-area blur filter.
- Performance has been optimized structurally, but smoothness cannot be guaranteed on every device without measurements. Check a low-power phone, a normal phone, and desktop. If any device drops frames, reduce its profile particle caps or FPS rather than disabling all effects indiscriminately.
- `prefers-reduced-motion` displays a static field and disables the ambient gradient animation. The hover star can still be redrawn on pointer movement without a continuous animation loop.
- Admin preview is still not real authentication; IndexedDB is local to each browser/device and does not synchronize between Mac and phone.
- GitHub publishing remains blocked by the repository owner's write permissions. This update is local only; no commit, push, PR or remote repository write was performed.

**Next:**
1. Apply the Session 013 bundle to the local `grid_website` repository root.
2. In `react-pilot`, run `npm test` (expected 37/37) and `npm run build`.
3. Run `npm run dev` and open the printed `Local` URL on the Mac and printed `Network` URL on a phone on the same trusted Wi-Fi.
4. On desktop Chrome, move the pointer slowly across individual stars. Confirm each directly hovered star turns crimson and fades back over roughly two seconds, without a large group of stars or a blob changing colour.
5. Watch the star field for a while. Confirm the brighter stars have only tiny directional trails and that the two slow background gradient cycles are visible but calm.
6. On mobile, confirm the field animates without hover, the background gradient breathes smoothly, and scrolling/filter/editor actions remain responsive.
7. Test with macOS/iOS reduced-motion enabled where available; background motion should stop and the content must remain fully usable.
8. Check for performance on a normal phone and a lower-power device. Record any stutter, heat, excessive battery use or frame drops before increasing particle density.
9. Continue updating this handoff after every meaningful local development/QA session. Publish the handoff to `feature/Timeline` once repository-owner write permission is restored.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Automated tests: `npm test` (37 tests; Node's built-in test runner).
- Production build: `npm run build`.
- Start local LAN-accessible preview: `npm run dev`.
- Desktop: use the printed `Local` URL. Phone: use the printed `Network` URL or `http://<Mac-Wi-Fi-IP>:<VITE-PORT>/` with both devices on the same trusted Wi-Fi. On Mac, get the LAN IP with `ipconfig getifaddr en0`. Use the exact port Vite prints if 5173 is occupied.
- Stop Vite with `Ctrl+C`. This remains a local development preview, not public hosting.


### Session 014 — Slower, evenly distributed starfield and broader gradient atmosphere (local only)

**Date:** 10 November 2026.

**Feature/task:** Address feedback that the Session 013 starfield moved too quickly and formed dense hotspots, and that the animated red-to-charcoal background glow was concentrated in the top-middle instead of recreating the earlier broad, soft atmosphere.

**Scope confirmation:** Timeline background only. No changes to the repository-root shared stylesheet, other website pages, shared navigation/footer, other teams' files, overall admin dashboard, authentication, deployment or remote GitHub state.

**Changes made and why:**
- Reduced star drift substantially. The maximum per-frame velocity range is now 0.12 on mobile and 0.16 on desktop (randomized around zero), yielding only a few pixels of movement per second at the adaptive frame rates. This replaces the visibly quick movement from the prior 0.50/0.68 ranges.
- Replaced fully random x/y placement with a lightly jittered row layout. Stars are distributed evenly across every row and spread across the row's full width. This keeps the field scattered and organic while preventing random local clusters/hotspots and avoiding a sparse partially filled final row.
- Broadened the ambient gradient across the full viewport. Crimson and deep-crimson fields now overlap from the left, right and lower viewport areas; the glow is no longer anchored around the top-middle. The permanent charcoal base is retained.
- Slowed the two overlapping gradient cycles to 76 seconds and 94 seconds. Opacity shifts gradually so red fades softly toward charcoal without rapid flashing or an isolated moving blob.
- Increased responsive line-connection distances slightly to maintain a subtle star-network feel after stars are distributed more evenly: 122px on mobile and 166px on desktop.
- Kept the prior adaptive canvas pixel ratio, particle count, frame-rate caps, spatial-hash link calculation, star-hover crimson afterglow, short star trails, visibility pause and reduced-motion behavior.

**Implementation details:**
- Added `createEvenStarPositions(width, height, count, random)` to `react-pilot/src/timelineBackground.js`. It derives a row count from viewport aspect ratio, balances the number of points per row to within one, spreads each row across the full width, and applies controlled random jitter (18%–82% of each cell) so it does not look like a strict grid. The random function is injectable for deterministic tests.
- `App.jsx` now uses `createEvenStarPositions` during canvas resize and applies the profile-specific `driftVelocity` to both axes. It no longer initializes every star at an unconstrained random x/y location.
- `getBackgroundProfile` now returns `driftVelocity` (0.12 phone / 0.16 desktop) and wider but still bounded link distances (122 / 166).
- Reworked `.ambient-glow::before` and `::after` with large, overlapping radial ellipses anchored at 18%/46%, 84%/61%, 48%/112%, 92%/18% and 4%/84%. This spreads the gradient through the viewport instead of creating a top-centred patch.
- The gradient pseudo-elements animate over 76s and 94s with modest opacity and sub-1% translation/low scale changes. The background stays anchored to the fixed viewport layer, with `#0A0A0C` as its permanent base and only official GRID crimson/deep-crimson accents.

**Files modified locally:**
- `react-pilot/src/App.jsx`.
- `react-pilot/src/timeline.css`.
- `react-pilot/src/timelineBackground.js`.
- `react-pilot/src/timelineBackground.test.js`.
- `react-pilot/src/timelineDesign.test.js`.
- `AI_HANDOFF.md`.

**Working currently (verified in this environment):**
- Automated Node test suite: PASS, 41/41 tests, 0 failures, 0 skipped, 0 cancelled.
- New tests verify slower phone/desktop drift limits, balanced row density, no duplicate row hotspots, full-width distribution, invalid/empty position inputs, broad gradient placement and the longer 76s/94s cycles.
- `node --check react-pilot/src/timelineBackground.js`: PASS.
- PostCSS parse of `timeline.css`: PASS.
- CSS scoping checks inherited from the previous session remain in the design test suite and pass.

**Testing performed and actual results:**
- `node --test react-pilot/src/*.test.js`: PASS, 41 tests, 0 failures, 0 skipped, 0 cancelled.
- `node --check react-pilot/src/timelineBackground.js`: PASS, no syntax errors.
- PostCSS parser validation of `react-pilot/src/timeline.css`: PASS.
- A Vite production build was NOT run in this environment because `react-pilot/node_modules` is absent. The contributor must run `npm run build` locally after applying this update.
- No live browser/device performance profiling was run here. Actual visual smoothness and gradient balance require Chrome desktop and phone verification.

**Known issues / limitations / incomplete work:**
- The star layout is intentionally evenly distributed using a jittered row system. Confirm on the Mac that it reads as a natural starfield rather than a visible grid. If rows appear too regular, increase position jitter slightly without permitting points to overlap.
- The slower drift is calculated from the renderer's adaptive frame delta; actual perceived movement may vary slightly with frame pacing. Check it visually before adjusting further.
- The 76s/94s gradient is intentionally subtle and slow. View the page for at least one minute to judge the full atmospheric cycle. The base remains charcoal; crimson never replaces the base colour completely.
- Actual browser visual rendering, performance profiling, battery/thermal behavior, reduced-motion and phone verification remain pending.
- Admin preview is still not real authentication; IndexedDB remains local to each browser/device and does not synchronize between devices.
- GitHub publishing remains blocked by repository-owner write permissions. This update is local only; no commit, push, PR or remote repository write was performed.

**Next:**
1. Apply the Session 014 bundle at the local `grid_website` repository root.
2. In `react-pilot`, run `npm test` (41 tests) and `npm run build`.
3. Run `npm run dev` and use the printed Local URL on the Mac and Network URL on a phone on the same trusted Wi-Fi.
4. Observe the desktop and phone star positions. They should be spread across the viewport, without clusters/hotspots or obvious rows.
5. Observe star motion for at least 30 seconds. It should be slow enough to feel atmospheric, not like particles flying across the screen.
6. Observe the gradient for at least 76 seconds. The charcoal base should remain while a broad, diffuse crimson wash gently strengthens and fades across left, right and lower regions; no top-centred hotspot or document-height colour bands should appear.
7. Recheck individual star hover on desktop: one directly hovered star turns crimson and fades back; this interaction remains disabled on touch-only devices.
8. Check phone scrolling, filtering, event details and the editor while the background runs. Note any frame drops or heat.
9. Test reduced-motion preferences; ambient and particle movement should stop while the content remains usable.
10. Continue updating this handoff after each meaningful local development/QA session. Publish to `feature/Timeline` only after repository-owner write access is restored.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Automated tests: `npm test` (41 tests; Node's built-in test runner).
- Production build: `npm run build`.
- Local LAN preview: `npm run dev`.
- Desktop: use the printed Local URL. Phone: use the printed Network URL with both devices on the same trusted Wi-Fi. If needed, retrieve the Mac LAN address using `ipconfig getifaddr en0` and use the exact Vite port shown in Terminal.
- Stop Vite using `Ctrl+C`. This remains a local development preview, not public hosting.


### Session 015 — Charcoal-dominant gradient and denser starfield (local only)

**Date:** 10 November 2026.

**Feature/task:** Respond to the contributor's latest desktop screenshot: the Session 014 background still read as a nearly solid red wash, while the natural scatter was liked and should be retained with more stars.

**Scope confirmation:** Timeline background only. No changes to the root shared stylesheet, other pages, navigation/footer, other teams' files, admin architecture, authentication, deployment or remote GitHub state.

**Changes made and why:**
- Rebalanced the background so `#0A0A0C` is visibly dominant. Reduced crimson/deep-crimson gradient stop opacity and opacity envelope; constrained the broad glow to edge/lower-corner areas with softer fades. The page should read as a charcoal night sky with crimson atmospheric accents, not a red canvas.
- Increased the adaptive particle count while preserving organic jittered placement. Normal desktop profiles now use 108–160 stars; normal phone profiles use 52–76; low-power phones use 30–42; low-power desktops use 82–120. The count is still based on viewport area and bounded by device profile.
- Shortened connection distance to 92px on phones and 124px on desktops. This counterbalances the higher star count, preserving individual dots and sparse constellations rather than producing a dense web/mesh.
- Kept the previously accepted natural random scatter helper and slow drift. No return to the visually obvious cursor-following blob.
- Preserved pixel-ratio caps, frame-rate caps, spatial-hash connection lookup, hidden-tab pause, reduced-motion fallback, crimson hover highlight and short trails.

**Implementation details:**
- `getBackgroundProfile` in `timelineBackground.js` now sets adaptive minimum/maximum counts and divisors: mobile 30–42 low power / 52–76 normal; desktop 82–120 low power / 108–160 normal. Viewport area is divided by 10,500 for mobile and 12,500 for desktop before min/max clamping.
- The canvas link radii are 92px mobile / 124px desktop, lower than Session 014's 122px / 166px, to keep connections restrained as dot count grows.
- `.ambient-glow` retains a permanent `#0A0A0C` base. `::before` now uses maximum crimson/deep-crimson stop alphas of 0.115/0.105 with a .56 layer opacity (slow 76s breathing); `::after` uses very low accent alphas (0.07/0.05) with .34 layer opacity (94s countercycle). The primary radial pools are placed toward the left edge and lower/right edges; broad overlapping gradients fade to transparency.
- Existing star positions remain jittered across rows to keep the organically scattered appearance the contributor approved. Particle drift remains slow (0.12 mobile / 0.16 desktop per frame at the capped animation rates).

**Files modified locally:**
- `react-pilot/src/timelineBackground.js`.
- `react-pilot/src/timelineBackground.test.js`.
- `react-pilot/src/timeline.css`.
- `react-pilot/src/timelineDesign.test.js`.
- `AI_HANDOFF.md`.

**Working currently (verified in this environment):**
- Automated Node test suite: PASS, 42/42 tests, 0 failures, 0 skipped, 0 cancelled.
- Background profile tests verify the higher normal phone/desktop counts and conservative low-power limits.
- A new connection-distance test verifies shorter 92px/124px links for denser particle counts.
- Gradient design regression tests verify the charcoal base, reduced crimson stops, edge/lower-corner positioning and 76s/94s breathing cycles.
- Jittered star-distribution, drift, spatial-hash, highlight timing, reduced-motion and CSS scoping tests remain passing.

**Testing performed and actual results:**
- `node --test react-pilot/src/*.test.js`: PASS, 42 tests, 0 failures, 0 skipped, 0 cancelled.
- `node --check react-pilot/src/timelineBackground.js`: pending final package verification.
- JSX transpile/browser validation: not run in this session because `App.jsx` did not change.
- Vite production build: not run in this container because the project dependencies are not installed here; run `npm run build` on the contributor's Mac.
- No real-browser screenshot, device performance benchmark, reduced-motion device setting or phone interaction was run after this update. Those must be checked on the Mac and phone.

**Known issues / limitations / incomplete work:**
- The screenshot showed a visibly red wash; the lower CSS alpha should make the charcoal base dominate, but the visual result must be checked in Chrome after applying this patch.
- Higher particle counts may increase drawing work on low-power devices. Low-power limits, adaptive frame caps, pixel ratio caps and spatial hashing remain in place, but real FPS/thermal/battery measurements are still required.
- The profile uses browser-provided `deviceMemory`, `hardwareConcurrency` and Save-Data hints where available; unsupported hints fall back to the normal device profile, so actual performance can vary.
- Admin preview remains local-only and does not provide production authentication or cross-device data synchronization.
- GitHub publishing remains unavailable due to repository-owner write-permission restrictions. This update is local only; no commit, push, PR or remote repository write was performed.

**Next:**
1. Apply this patch at the local `grid_website` repository root.
2. In `react-pilot`, run `npm test`, then `npm run build`, then `npm run dev`.
3. Check the printed Local URL on desktop and Network URL on a phone on the same trusted Wi-Fi.
4. Confirm that charcoal is the dominant background at the hero, mid-page and lower page; crimson should appear only as subtle atmospheric gradients near edges/lower areas.
5. Confirm there are noticeably more stars, still naturally scattered, without a dense connection mesh.
6. Watch the background for at least one minute, then check pointer hover highlighting and mobile animation.
7. Check frame pacing and device warmth on a normal phone and, if available, a lower-power phone. Reduce low-power counts if necessary based on observed measurements.
8. Test reduced-motion preferences; the starfield/gradient must become static while Timeline content remains usable.
9. Continue updating this handoff after each meaningful local development/QA session. Publish to `feature/Timeline` only after repository-owner write access is restored.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Automated tests: `npm test` (42 tests; Node built-in test runner).
- Production build: `npm run build`.
- Local LAN preview: `npm run dev`.
- Desktop: open the printed Local URL. Phone: open the printed Network URL on the same trusted Wi-Fi. If needed, use `ipconfig getifaddr en0` on the Mac and the exact port Vite prints.
- Stop Vite with `Ctrl+C`. This is a local development preview, not public hosting.

### Session 016 — Persistent crimson card halo and stronger gradient cycle (local only)

**Date:** 10 November 2026.

**Feature/task:** Respond to the latest card screenshot and feedback that the milestone still looked like a plain bordered box instead of having the requested crimson shadow, while the background gradient was too weak and slow.

**Scope confirmation:** Timeline visual styling only. No changes to the repository-root shared stylesheet, other pages, navigation/footer, other teams' files, data model, admin authentication, deployment or remote GitHub state.

**Changes made and why:**
- Added a visible but restrained crimson halo around milestone cards even at rest, rather than making the accent shadow appear only during hover. The halo wraps the card perimeter and lower edge, making the card feel lifted from the charcoal background instead of like a flat grey box.
- Increased the hover halo modestly so interaction feels responsive while retaining the GRID crimson palette.
- Strengthened the crimson/deep-crimson atmospheric gradient without replacing the permanent charcoal base. The glow remains broad and diffused rather than becoming a flat red page or a cursor-following blob.
- Shortened the two overlapping gradient cycles from 76s/94s to 32s/42s, so the red-to-charcoal breathing is easier to notice during normal browsing without turning into a flash or strobe effect.
- Kept existing star distribution, density, drift, hover highlighting, particle-link performance and reduced-motion behavior unchanged.

**Implementation details:**
- Updated the Timeline-only `--tl-shadow-red` token to combine a fine crimson edge, a low-opacity 22px all-around glow, a diffused crimson lower shadow and a deep-crimson ambient shadow.
- Applied `var(--tl-shadow-red)` to `.milestone-card` at rest; the hover state increases the edge/halo strength and preserves the dark lift shadow.
- Increased the first ambient gradient layer's crimson stop alphas to 0.24 and deep-crimson to 0.19/0.22. Its opacity envelope reaches 0.94, layered over the permanent `#0A0A0C` base.
- Increased the secondary gradient layer's alphas to 0.15/0.12 (with restrained secondary accent stops) and its opacity envelope to 0.68. The two gradient layers now cycle at 32s and 42s.
- No new dependencies, canvas effects, full-screen blur filters or global CSS selectors were introduced.

**Files modified locally:**
- `react-pilot/src/timeline.css`.
- `react-pilot/src/timelineDesign.test.js`.
- `AI_HANDOFF.md`.

**Working currently (verified in this environment):**
- Milestone cards now have an always-on crimson perimeter shadow, with a stronger hover shadow.
- The two background gradient cycles are 32s/42s and use stronger crimson/deep-crimson stops while retaining the charcoal base.
- Automated design tests assert the base and hover halo as well as the updated gradient strength/cycle durations.

**Testing performed and actual results:**
- `node --test react-pilot/src/*.test.js`: PASS, 44 tests, 0 failures, 0 skipped, 0 cancelled.
- The test suite includes assertions for the card's default crimson shadow token, stronger hover halo, official palette and 32s/42s gradient cycles.
- No Vite production build or real browser screenshot render was performed in this environment. The contributor should run `npm run build` and visually verify the updated card aura and gradient on the Mac before considering the styling approved.

**Known issues / limitations / incomplete work:**
- Shadow intensity is a design judgement and should be checked in the actual browser. If the halo feels too neon, reduce the 22px shadow alpha (currently 0.14) slightly; if it is still too subtle, increase that all-around alpha before increasing border saturation.
- Gradient strength is increased but still overlays the charcoal base; it does not transition the entire page background to solid crimson. Verify the new 32s/42s breathing at the hero, cards and lower sections.
- CSS and unit tests do not prove GPU frame pacing or cross-device rendering; retest on desktop and phone.
- Admin preview remains local-only and is not production authentication; IndexedDB data does not synchronize across devices.
- GitHub publishing remains unavailable due to repository-owner write-permission restrictions. This update is local only; no commit, push, PR or remote repository write was performed.

**Next:**
1. Apply the Session 016 bundle at the local `grid_website` repository root.
2. In `react-pilot`, run `npm test` (44 tests) and `npm run build`.
3. Run `npm run dev` and inspect milestone cards at rest. The crimson shadow should be visible around the whole card, not just under it.
4. Hover a card on desktop; the halo should strengthen smoothly without becoming neon.
5. Observe the background for at least 45 seconds. The 32s/42s cycles should be perceptible, broad and soft while charcoal remains visible.
6. Check the same layout on the phone and confirm there is no horizontal overflow, clipped glow or performance regression.
7. Continue updating this handoff after every meaningful local development/QA session. Publish it to `feature/Timeline` once repository-owner write permission is restored.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Automated tests: `npm test` (44 tests; Node built-in test runner).
- Production build: `npm run build`.
- Local preview: `npm run dev`; open the printed Local URL on desktop and Network URL on a phone on the same trusted Wi-Fi.
- Stop Vite with `Ctrl+C`. This remains a local development preview, not public hosting.

### Session 017 — Remove card aura and targeted performance optimization (local only)

**Date:** 10 November 2026.

**Feature/task:** Re-check compliance with the public GRID repository's shared design system, review Timeline performance, and remove the cheap-looking crimson aura visible around milestone cards in the contributor's screenshot.

**Scope confirmation:** Timeline-only. The repository-root shared `style.css`, Home, About Us, Core Team, FAQ, Contact, shared navigation/footer, other teams' assets, deployment and the remote repository were not modified. No commit or push was made.

**Repository/design-system cross-check:**
- Re-read the public repository's `main/style.css` and `feature/Timeline/style.css`. Both branches currently reference the same stylesheet blob (`cdd002b539a068e557f50ce969e4adcb1dd2727c`). It defines the GRID charcoal, raised-surface, crimson, deep-crimson, text, Space Grotesk/Inter, radius, spacing and shared glass tokens.
- Confirmed `react-pilot/src/main.jsx` imports `../../style.css` before `./timeline.css`.
- Confirmed Timeline page-specific CSS remains scoped under `.timeline-shell`; PostCSS parsing found 312 CSS rules and no unscoped class selectors.
- The public `feature/Timeline` branch is still only a basic HTML/stylesheet scaffold (`Timeline.html` remains empty); the React/Vite pilot and this handoff are local-only and have not been published.
- The local project must continue to follow `AI_HANDOFF.md`: Timeline-only scope, no unrelated site pages or overall admin dashboard, no invented GRID history, shared design tokens, responsive/reduced-motion behavior, and an updated handoff after each meaningful session. Every future authorized code commit must stage this handoff in the same commit.

**Changes made and why:**
- Removed the always-on red outer aura from milestone cards. The official 1px crimson border remains; the resting and hover shadows are neutral charcoal depth shadows. Hover lifts the card slightly and brightens the border without creating a red halo.
- Reduced repeated backdrop-filter work: generic liquid glass is 12px blur, milestone cards 8px on desktop and 4px on phones, modal backdrops 10px on desktop and 5px on phones, and compact notices 8px. Added a `prefers-reduced-transparency` fallback that disables backdrop filters while retaining opaque surfaces.
- Removed the full-screen SVG `feTurbulence` grain tile and `mix-blend-mode: soft-light`; this decorative layer was unnecessary and added a full-viewport compositing/filter surface.
- Lazy-load milestone card images, asynchronously decode stored milestone photos and local photo previews, and eagerly load only the first image in an opened event gallery.
- Reduced canvas shadow work: ordinary stars no longer use `context.shadowBlur`; only a star in its brief crimson hover state receives a small 4px maximum halo. The crimson highlight and small motion trail remain.
- Coalesce resize/orientation/address-bar resize bursts into one animation-frame canvas rebuild, and cancel any pending resize frame during component cleanup.
- Lower canvas backing-store pixel-ratio caps while preserving star counts and frame-rate profiles: normal phone 1.0, normal desktop 1.25, low-power phone 0.9, low-power desktop 1.0. This lowers canvas pixel work and memory without reducing the visible particle count.

**Implementation details:**
- Updated the `.milestone-card` default/hover `box-shadow` declarations and removed the obsolete `--tl-shadow-red` token.
- Tuned liquid-glass and modal/notice blur values, removed the `ambient-grain` DOM span and stylesheet rule, and added a reduced-transparency fallback.
- Updated `StoredPhoto` to accept a `loading` hint, use `decoding="async"` and `fetchPriority` for the first event-detail image.
- Added `scheduleResize` around `requestAnimationFrame` with cleanup for a queued resize callback.
- Updated `getBackgroundProfile` pixel ratio caps and matching unit tests.
- Replaced the old “visible aura” regression test with one that asserts the crimson border remains but card shadows contain no crimson values. Added tests for lazy images, resize cleanup, reduced canvas blur and restrained glass/filter use.

**Files modified locally:**
- `react-pilot/src/App.jsx`.
- `react-pilot/src/timeline.css`.
- `react-pilot/src/timelineBackground.js`.
- `react-pilot/src/timelineBackground.test.js`.
- `react-pilot/src/timelineDesign.test.js`.
- `AI_HANDOFF.md`.

**Working currently (verified in this environment):**
- Automated Node test suite: PASS, 48/48 tests, 0 failures, 0 skipped, 0 cancelled.
- PostCSS parsed the complete Timeline stylesheet successfully: 312 rules, no unscoped Timeline class selectors.
- TypeScript's JSX transpile parser reported zero diagnostics for `App.jsx` and `main.jsx`.
- `node --check` passed for `timelineBackground.js`, `timelineRepository.js` and `timelineValidation.js`.
- Existing adaptive star counts, spatial-hash connections, frame caps, hidden-tab pause, reduced-motion static canvas, indexed photo URL cleanup and `content-visibility: auto` remain in place.

**Testing performed and actual results:**
- `npm test`: PASS, 48 tests, 0 failures.
- PostCSS parse: PASS, 312 rules.
- JSX transpile diagnostics: 0 for `App.jsx` and `main.jsx`.
- `node --check` for the non-JSX modules listed above: PASS.
- `npm run build`: NOT RUN successfully in this isolated workspace because `react-pilot/node_modules` is absent and Vite is unavailable here (`vite: not found`). Re-run the Vite build on the contributor's Mac, where dependencies have previously been installed.
- No live browser, phone, FPS, thermal or battery benchmark was performed after this session. Do not describe performance as benchmarked; only the code-level optimizations and static/unit checks are verified.

**Known issues / limitations / incomplete work:**
- The outer aura should be gone while the thin crimson card border remains; verify the visual result in Chrome after applying the patch.
- The reduced backing-store pixel ratio may make tiny stars slightly softer on some high-DPI displays; assess on the Mac and phone, then adjust only if visual quality suffers.
- Lower CSS blur should reduce compositing work, but real frame pacing and mobile GPU cost need on-device testing.
- The local admin preview still uses browser-only IndexedDB and a preview toggle; it is not production authentication or shared cross-device storage.
- The public GitHub repository still does not contain the local React/Vite implementation or AI_HANDOFF file. Publishing is deferred because repository-owner write permissions have not been enabled. No remote write was attempted in this session.

**Next:**
1. Apply the Session 017 update at the local `grid_website` root.
2. Run `npm test` and `npm run build` from `react-pilot` on the Mac.
3. Open the local desktop and LAN phone URLs; confirm the card has a clean crimson border with no outer red aura.
4. Check card hover, glass readability, photo lazy loading, editor/modal scrolling and phone touch interactions.
5. Use Chrome DevTools Performance (or Safari Web Inspector) for a short scroll/animation recording; check dropped frames and main-thread work. Test on the actual phone rather than infer phone performance from desktop.
6. Test reduced-motion and reduced-transparency system preferences.
7. Keep updating this handoff after meaningful work sessions. Publish to `feature/Timeline` only when repository-owner permissions are restored and the contributor authorizes the relevant Git action.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Automated tests: `npm test` (48 tests; Node built-in test runner).
- Production build: `npm run build`.
- Local LAN preview: `npm run dev`; open the printed local URL on Mac and Network URL on the phone on the same trusted Wi-Fi.
- Stop Vite with `Ctrl+C`. This is a local preview, not public hosting.

### Session 018 — Mobile pinch-zoom viewport and starfield stability (local only)

**Date:** 10 November 2026.

**Feature/task:** Fix the mobile-only regression where the fixed Timeline background disappeared and canvas stars jumped, flickered or glitched badly when the visitor pinched to zoom.

**Scope confirmation:** Timeline-only. No changes to the shared root `style.css`, other groups' pages, navigation/footer, database, authentication, deployment or GitHub. No commit or push was made.

**Likely cause identified from the current implementation:**
- The canvas was sized from `window.innerWidth` and `window.innerHeight` only. During mobile pinch zoom, the visible `VisualViewport` can become smaller and offset inside the layout viewport, while the layout viewport dimensions may remain unchanged.
- Every `window.resize` rebuilt the backing canvas and generated an entirely new random star field. Mobile zoom and browser chrome/orientation events can emit resize bursts; repeatedly clearing/reallocating the canvas and randomizing particles can cause visible flicker, jumps or apparent disappearance.
- The fixed background layer was not explicitly following `visualViewport.offsetLeft`, `offsetTop`, `width` and `height` during pinch/pan.

**Changes made and why:**
- Added `getVisualViewportMetrics()` in `timelineBackground.js`. It reads the visible viewport rectangle and scale when the API exists, and safely falls back to `window.innerWidth/innerHeight` when it does not or returns invalid values.
- Added `rescaleParticlePositions()` to preserve each existing star's relative location and state when the visible viewport changes size. The star field is no longer regenerated on every resize/zoom event.
- Updated the background effect in `App.jsx` to position and size the fixed `.timeline-ambience` layer using the VisualViewport offsets and dimensions. This makes the background follow the actual visible phone screen while zoomed and panned.
- Listens to `window.resize`, `visualViewport.resize` and `visualViewport.scroll`. Geometry changes are coalesced to one animation frame; visual-viewport panning updates only the layer position/size.
- Delays canvas backing-store reallocation by 140 ms after the latest resize event. While a pinch gesture is in progress, CSS scales the existing canvas; after the gesture settles, the canvas is re-rasterized once. This avoids clearing/reallocating the bitmap repeatedly during zoom.
- Keeps the initially selected adaptive particle/FPS/pixel-ratio profile during pinch zoom. It deliberately does not multiply backing resolution by `visualViewport.scale`; browser compositing handles page scale, while canvas allocation remains bounded.
- Cleans up the queued geometry animation frame, delayed resize timer, window listeners and VisualViewport listeners on component teardown.
- Existing star density, slow drift, crimson hover response, spatial-hash connections, charcoal/crimson gradient, reduced-motion fallback and adaptive performance profiles remain intact.

**Files modified locally:**
- `react-pilot/src/App.jsx`.
- `react-pilot/src/timelineBackground.js`.
- `react-pilot/src/timelineBackground.test.js`.
- `react-pilot/src/timelineDesign.test.js`.
- `AI_HANDOFF.md`.

**Working currently (verified in this environment):**
- Pure viewport helper returns the smaller/offset visible viewport during simulated 2x pinch zoom.
- Helper falls back safely when `VisualViewport` is unavailable and rejects invalid dimensions/offsets.
- Particle-position rescaling preserves existing star count, velocity and highlight state without generating a new random constellation.
- Zoom/scroll/resize listeners and delayed backing-store resize are present and removed/cancelled during cleanup.

**Testing performed and actual results:**
- `npm test`: PASS, 53 tests, 0 failures, 0 skipped, 0 cancelled. This includes five additional tests for pinch-zoom viewport metrics, fallbacks, invalid values and particle state preservation.
- TypeScript `transpileModule` JSX parsing: PASS, zero error diagnostics for `App.jsx` and `main.jsx`.
- PostCSS parsed `timeline.css`: PASS, 219 top-level nodes.
- Static Timeline CSS scoping audit: PASS, no unscoped class selector lines.
- `node --check react-pilot/src/timelineBackground.js`: PASS.
- `npm run build`: NOT run in this isolated workspace because `react-pilot/node_modules/.bin/vite` is absent here. Re-run on the contributor's Mac, where Vite dependencies are installed.
- Actual phone pinch-zoom/browser verification: PENDING. Unit/static tests cannot prove visual viewport behavior on every mobile browser. The contributor reported this specific phone-only problem; retest on the same phone/browser after applying this update.

**Known issues / limitations / incomplete work:**
- The change is specifically designed for browsers exposing `window.visualViewport`; a safe layout-viewport fallback remains for older browsers.
- The visual layer is explicitly positioned to `visualViewport.offsetLeft/offsetTop` and sized to its width/height. Confirm this on the contributor's specific phone/browser; browser fixed-position behavior differs, so do not claim all devices are verified yet.
- Canvas backing resolution is updated after a 140 ms quiet period. If a particular browser emits a different event pattern, adjust that debounce only after reproducing it.
- No real FPS, battery, thermal or GPU benchmark was performed during this session.
- Local IndexedDB storage and Admin Preview remain prototype-only; events/photos are not shared between devices and the toggle is not real authentication.
- GitHub publishing remains paused because repository-owner write restrictions are unchanged. No remote write, commit, push or PR was attempted.

**Next:**
1. Apply the Session 018 bundle at the local `grid_website` repository root.
2. In `react-pilot`, run `npm test` (53 tests) and `npm run build` on the Mac.
3. Start `npm run dev` and open the printed Network URL on the same phone that previously showed the failure.
4. Pinch from 100% to roughly 150–200%, pan around while zoomed, then zoom back out. The background must remain visible; stars should not jump/re-randomize, flash or disappear.
5. Repeat while the phone browser address bar is showing and after it collapses; rotate the phone once and repeat.
6. Confirm that star density and particle motion remain visually stable before/after zoom, and that the Timeline cards/modals remain interactive.
7. If the phone still glitches, capture the phone model/browser/version and whether it happens in Safari or Chrome; use that reproduction to tune the viewport positioning rather than adding more visual effects.
8. Keep updating this handoff after each meaningful local development/QA session. Publish to `feature/Timeline` only once the repository owner restores the needed write permission and the contributor approves the relevant Git action.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Automated tests: `npm test` (53 tests; Node built-in test runner).
- Production build: `npm run build`.
- Local LAN preview: `npm run dev`; use the printed Network URL on a phone connected to the same trusted Wi-Fi as the Mac.
- Phone zoom check: pinch in, pan, pinch out; also test browser-toolbar transitions and orientation changes.
- Stop Vite with `Ctrl+C`. This is a local development preview, not public hosting.

### Session 019 — Sparse constellation and mobile zoom visual QA (local only)

**Date:** 10 November 2026.

**Feature/task:** Respond to the contributor's desktop/phone screenshots showing a dense, web-like star network. Preserve the naturally scattered star placement and brief crimson hover interaction, but make connections occasional and subtle. Confirm the zoomed screenshots were captured during pinch zoom and that the page returns to its normal layout after zooming out.

**Scope confirmation:** Timeline-only. No changes to repository-root `style.css`, other groups' pages/assets, shared navigation/footer, main-site architecture, admin authentication, database, deployment or GitHub. No commit or push was made.

**Repository/design-system check:**
- The public repository `main/style.css` and `feature/Timeline/style.css` were re-read in this session. They still resolve to the same shared stylesheet blob (`cdd002b539a068e557f50ce969e4adcb1dd2727c`) with the GRID palette, Space Grotesk/Inter typography, shared spacing/radii and glass tokens.
- The local Timeline pilot still imports `../../style.css` before `./timeline.css`; the shared stylesheet was not modified.
- Timeline CSS remains scoped under `.timeline-shell`. PostCSS audit parsed 312 rules and 364 non-keyframe selectors; 0 non-keyframe selectors were unscoped.
- The pinch-zoom screenshots were confirmed by the contributor to be taken while zoomed in; the page returns to normal once zoomed out. The content cropping in those zoomed screenshots is therefore not being treated as a normal-zoom responsive-layout regression. Existing VisualViewport handling remains in place.

**Changes made and why:**
- Preserved the existing scattered/jittered star positions, star counts, slow drift, twinkle, tiny motion trails and brief 2.2-second crimson pointer highlight.
- Replaced the dense nearby-pair drawing with a sparse constellation. Each star can connect to at most one other star, leaving most dots independent rather than forming a dense mesh.
- Connection candidates are chosen in nearest-first order and filtered using a deterministic index hash. This keeps the same links stable between rebuilds instead of randomly flickering.
- Reduced connection distances to 72px on phones and 102px on desktop.
- Reduced line opacity to 0.045 on phones and 0.055 on desktop, and reduced line widths to 0.42px and 0.5px respectively. Opacity now falls off with the square of proximity, so distant connections are much fainter.
- Rebuild the connection topology every 900ms rather than re-running spatial-hash candidate selection on every animation frame. Particle endpoints still move and are redrawn each frame; links outside the allowed radius are skipped until the next topology refresh.
- Normal-device connection chances are 0.40 on phones and 0.32 on desktop; low-power profiles use 0.28. Automated geometry checks with deterministic sample fields showed approximately 23% of phone stars and 26% of desktop stars connected for the normal-device profiles (the remainder stay independent). These percentages are sample results, not runtime guarantees.

**Implementation details:**
- Added `getSparseParticlePairs()` to `timelineBackground.js`; it reuses the existing spatial hash, sorts candidates by distance, applies a deterministic pair hash and enforces a configurable per-star degree cap.
- Added profile values for `maxConnectionsPerParticle`, `connectionChance`, `lineOpacity`, `lineWidth` and `connectionRefreshMs`.
- Updated the background draw loop in `App.jsx` to cache a sparse connection list and refresh it on the configured interval. It calculates current endpoint distance before drawing each cached link, so links that drift too far disappear instead of stretching unnaturally.
- Updated background tests for profile values, deterministic selection, degree caps, connection probability, independent stars and realistic phone/desktop star distributions.
- Updated Timeline design regression tests to ensure sparse connections are used, rebuilt at a controlled interval, rendered with the profile's subtle line settings, and retain star count, rescaling and crimson hover behavior.

**Files modified locally:**
- `react-pilot/src/App.jsx`.
- `react-pilot/src/timelineBackground.js`.
- `react-pilot/src/timelineBackground.test.js`.
- `react-pilot/src/timelineDesign.test.js`.
- `AI_HANDOFF.md`.

**Working currently (verified in this environment):**
- Automated Node test suite: PASS, 59/59 tests, 0 failures, 0 skipped, 0 cancelled.
- Deterministic sample starfield check: normal phone 52 stars / 6 links / 23% of stars connected; normal desktop 108 stars / 14 links / 26% connected. Every selected star has at most one connection.
- JavaScript syntax (`node --check`) passed for `timelineBackground.js`, `timelineRepository.js` and `timelineValidation.js`.
- TypeScript JSX transpile diagnostics: 0 for `App.jsx` and `main.jsx`.
- PostCSS parsed `timeline.css`: 312 CSS rules, 364 non-keyframe selectors, 0 unscoped selectors.
- The sparse constellation preserves the existing star positions and pointer-to-crimson highlight state; these are covered by tests.

**Testing performed and actual results:**
- `npm test`: PASS, 59 tests, 0 failures.
- JavaScript syntax checks: PASS for `timelineBackground.js`, `timelineRepository.js` and `timelineValidation.js`.
- JSX transpile parser: 0 errors for `App.jsx` and `main.jsx`.
- PostCSS: PASS, 312 rules parsed and no unscoped non-keyframe selectors.
- Deterministic phone/desktop profile sampling: PASS; 23% and 26% of stars connected respectively in the seeded sample.
- `npm run build`: NOT RUN in this isolated workspace because project-local `node_modules`/Vite dependencies are not present. Run it on the contributor's Mac.
- No live browser screenshot or real-device FPS/battery benchmark was performed after this session. Verify the visual density and phone performance on the contributor's actual devices; do not describe hardware performance as benchmarked.

**Known issues / limitations / incomplete work:**
- The user should confirm the network now feels like scattered stars with only occasional subtle pairs, rather than a spiderweb. If lines still feel too prominent, reduce `connectionChance` and `lineOpacity` rather than reducing the star count.
- The crimson hover interaction is desktop pointer behavior; touch devices do not have hover, by design.
- The screenshot was captured during pinch zoom; the contributor reports content returns to normal when zoomed out. Continue testing pinch-zoom background stability separately from the normal-zoom responsive layout.
- Real-world device performance, thermal load and battery consumption remain unmeasured.
- Admin preview remains a local UI prototype with IndexedDB storage, not production authentication or shared storage.
- The React/Vite pilot and this handoff remain local; the public repository's feature/Timeline branch has not received these files because repository-owner write permission remains unavailable. No remote write was attempted.

**Next:**
1. Apply this update from the local `grid_website` repository root.
2. Run `npm test` and `npm run build` from `react-pilot` on the Mac.
3. Check the starfield at normal zoom on desktop and phone. Most stars should be independent; a minority should form faint, short pairs.
4. Move the desktop pointer over individual stars and confirm one star turns crimson briefly then fades back.
5. Pinch-zoom on the phone, pan, then zoom out; confirm the background remains stable and the normal layout returns.
6. Use Chrome DevTools Performance or Safari Web Inspector for a short phone/desktop scroll recording; record actual observations before claiming FPS improvements.
7. Keep this handoff updated after each meaningful local session. Publish to `feature/Timeline` only after repository-owner write permission is restored and the contributor approves the relevant Git action.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Automated tests: `npm test` (59 tests; Node built-in test runner).
- Production build: `npm run build`.
- Local LAN preview: `npm run dev`; open the printed Network URL on a phone on the same trusted Wi-Fi.
- Test hover on desktop, pinch zoom/pan on phone, and normal layout after zooming out.
- Stop Vite with `Ctrl+C`. This is a local development preview, not public hosting.

### Session 020 — Zoom-aware constellation and persistent crimson atmosphere (local only)

**Date:** 10 November 2026.

**Feature/task:** Implement the contributor's requested pinch-zoom behavior: retain the nearby-star network at normal zoom; progressively fade/remove connections during pinch zoom; progressively reduce the visible star count as zoom increases; and ensure the crimson gradient remains visible on mobile while zoomed.

**Scope confirmation:** Timeline-only. No changes to repository-root `style.css`, other groups' pages/assets, shared navigation/footer, overall admin dashboard, authentication, database, deployment or GitHub. No commit or push was made.

**Changes made and why:**
- Split the background into two sibling layers: a full-layout-viewport atmospheric gradient and a separate zoom-aware star canvas.
- The gradient now stays fixed to the layout viewport and is never resized to `VisualViewport.width/height`. This addresses the reported mobile issue where the crimson gradient appeared to vanish as the browser zoomed in and the star canvas was resized.
- The star canvas continues to follow `VisualViewport` bounds and offsets so it remains aligned to the visible screen during pinch zoom and panning.
- At normal scale (1.0x), the star network is fully visible and nearby stars may connect through the existing spatial-hash/sparse-constellation algorithm.
- Connection opacity starts fading above 1.04x and reaches zero at approximately 1.58x. While zoomed beyond that threshold, the renderer skips connection topology drawing and clears the cached line list. Zooming out restores the network and triggers an immediate topology rebuild.
- Star visibility is progressively reduced with the zoom factor using a stable per-particle `zoomRank`. The zoom density factor is `max(0.24, 1 / scale^0.82)`. Approximate visible proportions: 1.25x = 84%, 1.5x = 72%, 2x = 57%, 3x = 41%, 4x = 33%, and the 6x cap = 24%.
- Star inclusion ranks are created once per star and are preserved when particle positions are rescaled. This avoids regenerating a different constellation or causing stars to jump when zooming in/out.
- Star movement and rendering loops skip stars hidden by the current zoom density. Connection lines are drawn only when both endpoint stars are currently visible.
- When zooming back to 1x, full star density and connection opacity are restored. Existing star hover/highlight behavior, normal star counts, drift, twinkle and the crimson/charcoal gradient animation are preserved.

**Implementation details:**
- Added `getZoomPresentation(scale)` to `timelineBackground.js`. It returns clamped zoom scale, network opacity, particle density and a connections-visible flag.
- Added `shouldRenderParticle(particle, density)` to apply stable zoom culling without mutating the original particle objects.
- Added stable `zoomRank` values to each star at initialization.
- Updated `applyLayerBounds()` in `App.jsx` to read VisualViewport scale and update zoom presentation as viewport geometry changes.
- Updated the animation loop to fade line opacity with zoom, stop building/drawing network links at higher zoom, and cull stars according to their stable zoom ranks.
- Split the previous combined ambience markup into `.timeline-atmosphere` (gradient) and `.timeline-ambience` (canvas).
- Added `.timeline-atmosphere` CSS as a fixed full-layout-viewport layer with `100vw`, `100dvh`, paint containment and its own compositing layer. The JS viewport-bounds synchronization still applies only to `.timeline-ambience`/canvas, not the gradient layer.
- Added automated helper and design-regression tests for zoom scale, line fade, particle density, stable star restoration, separate gradient/canvas positioning and VisualViewport integration.

**Files modified locally:**
- `react-pilot/src/App.jsx`.
- `react-pilot/src/timelineBackground.js`.
- `react-pilot/src/timelineBackground.test.js`.
- `react-pilot/src/timeline.css`.
- `react-pilot/src/timelineDesign.test.js`.
- `AI_HANDOFF.md`.

**Working currently (verified in this environment):**
- Automated Node test suite: PASS, 67/67 tests, 0 failures, 0 skipped, 0 cancelled.
- New zoom-presentation unit tests verify full network at 1x, progressive fade during zoom, no connections after approximately 1.58x, progressively reduced star density and full restoration when returning to 1x.
- Stable-star-rank tests verify zoom culling leaves the original star list, positions and highlight state intact.
- PostCSS parsed `timeline.css`: PASS, 301 CSS rule entries and 0 unscoped non-keyframe selectors.
- `node --check` passed for `timelineBackground.js`, `timelineRepository.js` and `timelineValidation.js`.
- The full Vite production build was not run in this isolated workspace because project-local Vite/node_modules are not present. Run `npm run build` on the contributor's Mac.
- No live browser screenshots or physical-device tests were performed after this session. Verify the gradient on a real phone while pinch-zoomed; this is the key acceptance test.

**Known issues / limitations / incomplete work:**
- Confirm on the actual phone that the separated layout-viewport atmosphere remains visible throughout pinch zoom and panning. If a particular browser still hides it, capture browser name/version and device model; do not reintroduce coupling between the gradient and canvas viewport layer.
- Verify that the star network remains natural at 1x, fades smoothly while zooming and disappears by roughly 1.6x. Check that fewer stars remain visible at 2x and above, then the same constellation returns at 1x.
- The density calculation intentionally retains at least 24% of stars at high zoom; actual perceived density depends on device/browser zoom behavior.
- Real-device FPS, battery, temperature and GPU memory remain unmeasured.
- Admin preview remains a local UI prototype with IndexedDB storage, not production authentication or shared storage.
- The React/Vite pilot and this handoff remain local; the public repository's `feature/Timeline` branch has not received these files because repository-owner write permission remains unavailable. No remote write was attempted.

**Next:**
1. Apply this update from the local `grid_website` repository root.
2. Run `npm test` and `npm run build` from `react-pilot` on the Mac.
3. Start `npm run dev` and open the printed Network URL on the phone connected to the same trusted Wi-Fi.
4. At 1x, confirm the crimson gradient and nearby-star network are present.
5. Pinch to 1.25x, 1.5x, 2x and 3x. Confirm lines fade, disappear around 1.6x and fewer stars remain visible at each zoom level.
6. Keep panning while zoomed. Confirm the gradient stays visible and the star canvas remains aligned without flicker.
7. Zoom back to 1x. Confirm the full starfield and network return without stars being randomly regenerated.
8. Keep this handoff updated after each meaningful local development/QA session. Publish to `feature/Timeline` only after repository-owner write permission is restored and the contributor approves the relevant Git action.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Automated tests: `npm test` (67 tests; Node built-in test runner).
- Production build: `npm run build`.
- Local LAN preview: `npm run dev`; open the printed Network URL on a phone on the same trusted Wi-Fi as the Mac.
- Pinch test at 1x → 1.25x → 1.5x → 2x → 3x → 1x while panning. The gradient should stay visible; network should fade away; star density should reduce and restore.
- Stop Vite with `Ctrl+C`. This is a local development preview, not public hosting.

### Session 021 — Corrected visual-viewport anchoring and proximity network (local only)

**Date:** 10 November 2026.

**Feature/task:** Correct the unsuccessful Session 020 mobile zoom behavior after the contributor reported that the constellation/zoom changes did not work and that the crimson gradient still disappeared. Restore reliable network connections at normal zoom, then fade the network and reduce stars as zoom increases.

**Scope confirmation:** Timeline-only. No changes to repository-root `style.css`, other teams' assets/pages, shared navigation/footer, main-site architecture, overall admin dashboard, authentication, database, deployment or GitHub. No commit or push was made.

**Root-cause correction:**
- Session 020 left `.timeline-atmosphere` attached to the layout viewport while moving only the star canvas with `VisualViewport.offsetLeft/offsetTop`.
- That assumption was wrong for pinch zoom: CSS `position: fixed` elements are laid out against the layout viewport, while pinch zoom exposes a smaller, offset VisualViewport slice. If the user pans away from the layout viewport origin, a fixed gradient that is not offset to the visible slice can be left behind. Chrome's VisualViewport explanation documents this distinction: https://developer.chrome.com/blog/visual-viewport-api/ and https://developer.chrome.com/blog/viewport-resize-behavior/.
- The fix is to synchronize BOTH the gradient layer and the star canvas to the current VisualViewport bounds. This session explicitly supersedes Session 020's previous claim that leaving the gradient fixed at the layout viewport origin would guarantee it remained visible.

**Changes made and why:**
- Added one `setVisualViewportBounds(element, viewport)` helper in `App.jsx`. `applyLayerBounds()` now applies `left`, `top`, `width` and `height` from `VisualViewport.offsetLeft`, `offsetTop`, `width` and `height` to BOTH `.timeline-atmosphere` and `.timeline-ambience`.
- Added a normal `window` scroll listener in addition to VisualViewport resize/scroll listeners. All updates are coalesced through the existing animation-frame scheduler. Canvas backing-store allocation remains debounced until the gesture settles; CSS dimensions and layer bounds can follow the visible viewport during the gesture.
- `getVisualViewportMetrics()` now infers an effective zoom factor as the maximum of the reported `VisualViewport.scale` and `innerWidth / visualViewport.width`. This catches mobile/embedded browser cases where the reported scale can lag while the visible width has already contracted. It also returns page coordinates for diagnostics and safe fallback handling.
- Kept the existing zoom presentation policy: lines fade between approximately 1.04x and 1.58x; star visibility reduces progressively with stable per-star `zoomRank`; zooming out restores the same constellation.
- Corrected the network logic because the previous random connection-chance gate could reject close star pairs, and the 900ms topology refresh could make new close approaches appear late. Connections now use proximity as the deciding rule (`connectionChance: 1`), with one nearest connection maximum per star, shorter connection radii (55px phone / 78px desktop), slightly more visible GRID-maroon line opacity, and a 320ms topology refresh. This keeps the network to isolated pairs/short links rather than allowing a dense web.
- The existing network still fades out at increased zoom and returns at 1x; the gradient and canvas now receive the same viewport offsets so the crimson atmosphere is not left at the old layout-viewport origin.

**Files modified locally:**
- `react-pilot/src/App.jsx`.
- `react-pilot/src/timelineBackground.js`.
- `react-pilot/src/timelineBackground.test.js`.
- `react-pilot/src/timelineDesign.test.js`.
- `react-pilot/src/timeline.css` (comment and removal of unnecessary atmosphere compositing transform; shared root stylesheet untouched).
- `AI_HANDOFF.md`.

**Working currently (verified in this environment):**
- Automated Node test suite: PASS, 73/73 tests, 0 failures, 0 skipped, 0 cancelled.
- New VisualViewport tests verify the normal reported scale, stale-scale inference from layout width, reported-scale precedence, offset retention and page-coordinate fallbacks.
- Design regression tests verify both the gradient and canvas receive the same VisualViewport bounds, and that window scroll plus VisualViewport scroll/resize events resynchronize them.
- Seeded connection sampling: normal phone profile = 52 stars, 10 links, 38.5% of stars linked; normal desktop profile = 108 stars, 22 links, 40.7% of stars linked. Each star is limited to one link in these samples. These are deterministic test samples, not universal runtime guarantees.
- JavaScript syntax checks: PASS for `timelineBackground.js`, `timelineRepository.js` and `timelineValidation.js`.
- TypeScript JSX transpile diagnostics: 0 for `App.jsx` and `main.jsx`.
- PostCSS parsed `timeline.css`: PASS, 313 CSS rules, 0 unscoped non-keyframe selectors.
- Vite production build: NOT RUN in this isolated workspace because project-local `node_modules/.bin/vite` is not installed. Run `npm run build` on the contributor's Mac.
- No real-device or browser screenshot test was performed after this session. The phone pinch-zoom test remains the key acceptance check.

**Known issues / limitations / incomplete work:**
- The actual phone/browser may implement viewport positioning slightly differently. Confirm the crimson gradient follows the visible phone screen during pinch zoom AND panning. If it still disappears, record the browser name/version and phone model; do not assume the code-level tests prove this physical-device behavior.
- Confirm network links appear at 1x when stars are close, fade smoothly during zoom and disappear around 1.58x, then return at 1x.
- Confirm star density decreases progressively at higher zoom and the same stars restore after zooming out.
- Actual FPS, battery/thermal load and GPU memory remain unmeasured.
- Admin preview remains a local UI prototype with IndexedDB storage, not production authentication or shared storage.
- The React/Vite pilot and handoff remain local; the public repository's `feature/Timeline` branch has not received these files because repository-owner write permission remains unavailable. No remote write was attempted.

**Next:**
1. Apply this Session 021 ZIP from the local `grid_website` repository root.
2. Run `npm test` and `npm run build` from `react-pilot` on the Mac.
3. Run `npm run dev` and open the printed Network URL on the Android phone on the same trusted Wi-Fi.
4. At 1x, confirm nearby stars form a few short, visible maroon links.
5. Pinch to 1.25x, 1.5x and 2x. Confirm the network fades away and visible star count reduces.
6. While zoomed, pan to different parts of the page. Confirm the gradient remains behind the visible screen and does not stay at the old layout position.
7. Zoom back to 1x. Confirm the original network and full starfield return without regeneration or flicker.
8. Report the actual phone model and Chrome version if the viewport anchoring still fails; browser measurements and physical rendering must be compared before further changes.
9. Continue updating this handoff after every meaningful local session. Publish to `feature/Timeline` only after repository-owner write permission is restored and the contributor authorizes the Git action.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Automated tests: `npm test` (73 tests; Node built-in test runner).
- Production build: `npm run build`.
- Local LAN preview: `npm run dev`; open the printed Network URL on the phone on the same trusted Wi-Fi.
- Phone test sequence: 1x → 1.25x → 1.5x → 2x, pan around while zoomed, then zoom back out to 1x. The gradient must track the visible viewport, the network should fade, and the same starfield should restore.
- Stop Vite with `Ctrl+C`. This is a local development preview, not public hosting.

### Session 023 — Restore the Session 021 proximity-first star network (local only)

**Date:** 10 November 2026.

**Feature/task:** Roll back only the star-connection behavior after the supplied Session 022 bundle's denser network stopped matching the earlier working presentation. Preserve the existing Timeline UI, mobile page-canvas cleanup, and other features.

**Rollback decision:** The best-supported reference is Session 021, not Session 019. Session 021 is the latest network correction recorded before the supplied Session 022 code snapshot. Its handoff explicitly describes a proximity-first rule, one nearest connection maximum per star, 55px/78px phone/desktop radii, and a 320ms topology refresh. Session 019 is an earlier sparse version and is not the chosen target.

**Changes made and why:**
- Restored proximity-first connection selection: all eligible close pairs are considered, then the nearest pairs are selected with a strict maximum of one connection per star. The random chance gate from the supplied Session 022 profile is removed (`connectionChance: 1`).
- Restored the Session 021 connection radii: 55px on phones and 78px on desktop.
- Restored the 320ms connection-topology refresh interval.
- Returned the connection stroke to muted GRID maroon (`rgba(122, 22, 32, alpha)`) rather than the brighter crimson stroke.
- Reduced the supplied Session 022 line weight/opacity to a moderate value. The Session 021 handoff described its line opacity as “slightly more visible” but did not preserve exact numeric opacity/width values; the current values (0.10/0.11 opacity and 0.82/0.8px width for phone/desktop) are a conservative reconstruction, not a byte-for-byte recovery of an old source file.
- Restored the earlier per-screen star density ranges (normal phone 52–76, normal desktop 108–160; lower ranges for low-power devices). Because the supplied Session 022 canvas spans the whole document, the count is scaled by document height so the on-screen density remains comparable while scrolling.
- Kept the supplied Session 022 page-sized canvas, visible-region drawing, ResizeObserver/content-growth handling, low backing-store pixel-ratio caps, VisualViewport zoom simplification, stable star ranks, drift, twinkle, hover highlight, and reduced-motion/hidden-tab behavior. These later mobile mechanics were not rolled back.
- Did not change `timeline.css`, the shared root stylesheet, milestone cards, filters, admin preview, modal/editor, data storage, navigation, or any other Timeline feature.

**Files modified locally:**
- `react-pilot/src/App.jsx` — connection comments, muted maroon stroke, and draw threshold for the restored profile.
- `react-pilot/src/timelineBackground.js` — document-height-scaled star density and Session 021 connection profile.
- `react-pilot/src/timelineBackground.test.js` — restored profile, opacity, density and sparse-pair expectations.
- `react-pilot/src/timelineDesign.test.js` — static regression assertions for the restored Session 021 network.
- `AI_HANDOFF.md`.

**Working currently (verified in this environment):**
- Background helper suite: PASS, 30/30 tests, 0 failures.
- Deterministic sample fields verify one connection maximum per star, 55px/78px proximity radii, and a visible minority of linked stars.
- JavaScript syntax checks for `timelineBackground.js`, `timelineBackground.test.js` and `timelineDesign.test.js`: PASS.
- TypeScript JSX parser check for `App.jsx`: PASS, zero diagnostics.
- Static assertions for the restored Session 021 network settings and retained document-canvas/zoom features: PASS.

**Testing performed and actual results:**
- `node --test react-pilot/src/timelineBackground.test.js`: PASS, 30 tests, 0 failures.
- `node --check react-pilot/src/timelineBackground.js`: PASS.
- Full `npm test` and `npm run build` were not run here. The supplied ZIP does not include `package.json`, `timeline.css`, or project dependencies, so the complete project test/build commands cannot run from this bundle alone. Run them in the contributor's full local repository.
- No live browser rendering, desktop mouse interaction, or physical phone QA was available here. The code-level tests do not prove that the network looks correct on the actual phone.

**Known issues / limitations / incomplete work:**
- The exact Session 021 opacity and width values were not recorded in the handoff; the current moderate values are a deliberate reconstruction.
- The mobile pinch-zoom behavior is intentionally retained: the network fades and star density thins as zoom increases, then restores at normal zoom.
- Real device frame pacing and the visual line contrast still require checking in the contributor's browser/phone.
- The local pilot and handoff remain local. No Git commit, push, pull request or remote repository change was performed.

**Next:**
1. Apply this focused ZIP to the existing `grid_website` repository root; it contains only the Timeline app/module/test files and `AI_HANDOFF.md`.
2. In `react-pilot`, run `npm test` and `npm run build` using the complete local project.
3. Start `npm run dev` and check the normal 1x view first. Nearby stars should form short, isolated maroon pairs; no star should have multiple branches or form a dense web.
4. Check desktop hover, page scrolling, phone scrolling, and then pinch zoom. The network should remain present at 1x, simplify while zoomed, and return when zoomed out.
5. Report any visual mismatch with device/browser and viewport details before changing other parts of the background.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Automated tests: `npm test`.
- Production build: `npm run build`.
- Local preview: `npm run dev`; use the printed Network URL on a phone connected to the same trusted Wi-Fi.
- Stop Vite with `Ctrl+C`. This remains a local development preview, not public hosting.


### Session 022 — Random drifting white stars with proximity-fading red links (local bundle)

**Date:** 10 November 2026.

**Feature/task:** Replace the unwanted capped constellation behavior with the requested simple starfield: small white circular stars are scattered randomly and drift across the complete Timeline document. When two or more stars come close, a faint deep-red line appears between each nearby pair; as they move apart, that line smoothly fades to transparent.

**Scope confirmation:** Timeline background/network only. The shared root stylesheet, other site pages, navigation/footer, Timeline cards/content, admin UI, data model, and mobile page-canvas/VisualViewport handling were left unchanged. No commit or push was made. The previous Session 023 one-link-per-star rollback bundle is superseded and should not be applied.

**Changes made:**
- Replaced jittered-grid star placement with uniform random positions across the full document-sized canvas.
- Stars are now small white circles with gentle drift in a random direction and subtle white-only twinkle. Removed red cursor hover highlighting and motion trails so the stars remain visually simple and white.
- Preserved the existing full-document canvas, adaptive particle density, reduced-motion support, frame caps, pixel-ratio limits, resize behavior and mobile zoom/pan alignment.
- Replaced capped/probabilistic sparse-pair selection with all-pairs proximity detection via the existing spatial hash. Every pair inside the short connection radius can connect; three nearby stars can form their three pairwise lines.
- Set connection radius to 38px on phones and 48px on desktop. Lines use a thin, faint deep-red stroke (`rgba(190, 0, 36, alpha)`) and are refreshed every 100ms.
- Recalculate each line's opacity from current distance on every rendered frame, using an eased proximity curve. The line becomes fully transparent at the radius boundary, so it fades as the stars separate rather than abruptly switching off.

**Files modified in this bundle:**
- `react-pilot/src/App.jsx`.
- `react-pilot/src/timelineBackground.js`.
- `react-pilot/src/timelineBackground.test.js`.
- `react-pilot/src/timelineDesign.test.js`.
- `AI_HANDOFF.md`.

**Verification:**
- `node --check react-pilot/src/timelineBackground.js`: PASS.
- `node --test react-pilot/src/timelineBackground.test.js`: PASS, 27/27 tests. Tests cover random full-document placement, all nearby pairs (including three-star groups), short radii, smooth distance fade, drift, canvas resizing and retained zoom behavior.
- `timelineDesign.test.js` was updated for the new starfield and network, but could not be executed in this isolated bundle because the supplied incremental ZIP does not contain `react-pilot/src/timeline.css` or `main.jsx`, which that test reads. Run the complete `npm test` and `npm run build` in the contributor's full local repository.
- No browser or physical-phone render was available here. The final look and actual mobile behavior still need the local desktop/phone preview check.

**Next local checks:**
1. From the full repository, run `cd react-pilot`, then `npm test` and `npm run build`.
2. Run `npm run dev`; open the Local URL on the Mac and Network URL on the phone on the same trusted Wi-Fi.
3. Scroll the Timeline from top to bottom: white dots should be scattered and slowly drift across the full page, not sit in rows.
4. Watch stars that approach: thin, very faint deep-red lines should appear; as the stars separate, the lines should fade smoothly until invisible. Nearby triples may create a tiny triangle; the page should not look like a dense mesh.
5. Confirm the rest of the Timeline and mobile zoom/pan behavior remain unchanged.
6. Keep GitHub/commit/push actions separate and only perform them with explicit authorization.


### Session 024 — Remove red connections and evenly distribute drifting white stars

**Date:** 10 November 2026.

**Feature/task:** Following user feedback, permanently remove the red connection-line effect from the Timeline starfield and make the remaining white circular stars distribute and drift more uniformly across the full Timeline document. The horizontal-versus-vertical Timeline layout was discussed only; no layout change was made.

**Decision / scope:**
- The starfield now consists only of small white circular dots. There are no proximity checks, connection pairs, red strokes, line-opacity calculations, line refresh timers, or connection-specific zoom behavior.
- Stars are distributed with a stratified random placement: their count is balanced across page bands, while each position is jittered within its area. This gives an even spread without a visible grid and avoids large random clumps or empty patches.
- Each star receives an independent direction but the same speed for the current device profile. This keeps motion consistent while avoiding all stars moving in lockstep.
- Existing full-document canvas sizing, wraparound movement, subtle white twinkle, frame caps, pixel-ratio limits, reduced-motion handling, resize preservation, mobile VisualViewport zoom/pan behavior, and zoom-based star thinning are retained.
- No Timeline card, content, filters, admin UI, editor, data model, stylesheets, navigation, shared site components, or other project areas were changed.
- Horizontal scrolling is not implemented. It remains a design discussion only.

**Files modified in this session:**
- `react-pilot/src/App.jsx` — removed all line drawing / pair tracking; switched star creation to uniform stratified placement and consistent-speed drift.
- `react-pilot/src/timelineBackground.js` — removed all line/network helpers and profile values; added `createUniformStarPositions` and `createUniformStarDrift`; simplified zoom presentation to star density only.
- `react-pilot/src/timelineBackground.test.js` — removed connection tests and added coverage for evenly distributed jittered placement, same-speed independent drift, and absence of connection settings.
- `react-pilot/src/timelineDesign.test.js` — updated static expectations for white-only starfield and no line rendering.
- `AI_HANDOFF.md` — this session entry.

**Verification performed:**
- `node --test react-pilot/src/timelineBackground.test.js`: PASS, 22/22 tests.
- `node --check react-pilot/src/timelineBackground.js`: PASS.
- `node --check react-pilot/src/timelineBackground.test.js`: PASS.
- `node --check react-pilot/src/timelineDesign.test.js`: PASS.
- TypeScript JSX parse check for `react-pilot/src/App.jsx` (`tsc --noEmit --allowJs --checkJs false --jsx preserve --target es2022 --module esnext --noResolve App.jsx`): PASS, no diagnostics.
- Source scan confirms no line-drawing calls, connection helpers, connection-pair state, or red line styling remain in `App.jsx` or `timelineBackground.js`.
- The incremental bundle does not include the full `timeline.css`, `main.jsx`, `package.json`, or dependencies; therefore the complete `npm test` and `npm run build` cannot be run from this package alone. No live browser or physical phone rendering was available in this environment.
- No Git commit, push, pull request, or remote repository change was made.

**Next local checks:**
1. Apply the incremental patch to the repository root.
2. From `react-pilot`, run `npm test` and `npm run build` in the full project.
3. Preview desktop and phone. Scroll from the top to the bottom and confirm the small white dots remain spread across the complete document, drift at a consistent pace, and wrap cleanly at the canvas edges. Confirm there are no red connecting lines.
4. Recheck phone pinch zoom and normal scrolling to ensure the canvas and gradient remain aligned.
5. Keep any horizontal Timeline prototype separate until the user confirms the direction.

**Horizontal-versus-vertical design note (not implemented):** A fully horizontal timeline can communicate chronological progression well on desktop, but it makes long histories harder to browse, can hide content beyond the viewport, and adds sideways-navigation friction on phones. The safer recommendation is to retain vertical scrolling as the default, or prototype a horizontal desktop-only timeline with clear arrows, keyboard controls, drag/trackpad support and year markers while keeping mobile vertical. Evaluate the prototype before replacing the current layout.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Automated tests: `npm test`.
- Production build: `npm run build`.
- Local preview: `npm run dev`; use the printed Network URL on a phone connected to the same trusted Wi-Fi.
- Stop Vite with `Ctrl+C`. This remains a local development preview, not public hosting.


### Session 025 — Modular Timeline page builder and admin-selectable orientation (local testing pilot)

**Date:** 10 November 2026.

**Feature/task:** Extend the Timeline pilot toward the original modular/widget-based page plan. In admin preview, allow the page owner to edit page-section copy without editing React code, add/remove reusable content widgets, reorder/hide/show widgets, and choose whether milestone browsing uses a vertical or horizontal scroller. Also address the spacing/oversized category select shown in the user's 12:26 PM screenshot.

**Scope confirmation:** Isolated Timeline pilot only. No shared root `style.css`, other GRID pages, site-wide navigation/footer, other teams' components, public repository files, production admin/authentication, cloud database, API, hosting or GitHub branch was changed. No commit, push or PR was made.

**Architecture/design decisions:**
- The default remains **vertical** so the current experience is preserved until an admin explicitly changes it.
- Horizontal mode is a separate presentation of the same filtered chronological milestones: one continuous horizontal card rail, each card marked with its year. It supports native touch/trackpad scrolling, scroll snapping, keyboard focus/scrolling and previous/next arrow controls. Year/category filters and milestone detail/edit behavior remain available.
- The page is now rendered from an ordered widget configuration. Built-in widgets: Hero, Timeline intro, Milestone timeline and Footer. Addable content widgets: Text section and Quote/callout. All widgets can be edited, moved up/down and shown/hidden. Custom Text and Quote widgets can also be removed. Existing milestone content remains managed through the existing milestone editor.
- Widget/page settings use a versioned localStorage key (`grid.timeline.page-config.v1`) during the testing phase. The page builder draft previews live and can be saved or discarded. This is local to the current browser/device and does not synchronize to other visitors or staff. Before production, move this configuration to the approved shared API/database and gate it behind the main site's authenticated admin permissions.
- No drag-and-drop dependency was added; move-up/move-down buttons keep ordering usable on touch devices and keyboards.
- The supplied screenshot showed the category filter select unusually tall and the label/control spacing inconsistent. A scoped CSS override now gives the select a 46px fixed height, consistent inline gap, compact padding and a stacked responsive mobile arrangement.

**Files modified/added:**
- `react-pilot/src/App.jsx` — config-driven page widget rendering, page builder state/actions, and vertical/horizontal rendering for the same filtered milestones.
- `react-pilot/src/TimelinePageBuilder.jsx` — admin-only local page builder UI for orientation, widget copy, visibility, ordering, add/remove controls, save/discard.
- `react-pilot/src/timelinePageConfig.js` — default widget schema, allowed widget definitions, normalization, safe fallback, localStorage load/save and cloning helpers.
- `react-pilot/src/timelineModular.css` — Timeline-scoped page-builder styling, horizontal rail styling, responsive rules and compact category-filter spacing.
- `react-pilot/src/timelinePageConfig.test.js` — tests for defaults, widget creation, normalization, duplicate IDs, local storage, fallbacks and cloning.
- `react-pilot/src/timelinePageBuilderDesign.test.js` — static regression tests for widget rendering/admin controls, orientation selection, horizontal scroller accessibility, filter sizing and selector scoping.
- `AI_HANDOFF.md` — this session record.

**Verification performed in the isolated working bundle:**
- `node --test timelineBackground.test.js timelinePageConfig.test.js timelinePageBuilderDesign.test.js`: PASS, 36/36 tests.
- TypeScript JSX parse check for `App.jsx` and `TimelinePageBuilder.jsx`: PASS, zero diagnostics.
- `timelineModular.css` parsed with PostCSS: PASS, 117 CSS rules.
- The existing white-star background source and its 22 regression tests remain unchanged and pass as part of the 36-test run.
- Full project `npm test` and Vite `npm run build` were NOT run because this incremental source bundle does not include the full app (`package.json`, `main.jsx`, existing `timeline.css`, repository/validation modules and installed `node_modules`).
- No live browser render, desktop trackpad check or physical phone check was possible here. The new layout and screenshot spacing fix therefore still require local visual verification.

**Known limitations / things to verify:**
- Page builder and page orientation settings are local-only by design for testing. Clearing browser storage or using another device will not carry the settings over.
- Horizontal mode is intentionally one continuous rail across all filtered milestones, not separate mini-rails inside each year. Confirm this matches the desired visual direction before keeping it as a production option.
- On phone, horizontal mode should remain a horizontal swipe area inside the page, while the rest of the page continues normal vertical scrolling. Test touch gesture handoff and the arrow controls.
- Verify the compact 46px category dropdown on both desktop and narrow phone widths. The screenshot only showed a cropped filter row; inspect the full page spacing after the patch is applied.
- Verify that milestone detail dialogs and admin editing still work from horizontal cards.
- Future widget types (image/gallery, event highlights, resource links, etc.) can be added through the same schema/renderer pattern after the current Text and Quote widgets are reviewed.

**Next local checks:**
1. Apply the incremental bundle to the existing `grid_website` repository root, preserving unrelated files.
2. From `react-pilot`, run `npm test` and `npm run build` in the complete local project.
3. Run `npm run dev` and review the default vertical layout on desktop and phone; check section spacing and the 46px category select.
4. Enter Admin preview → Edit page widgets. Edit the Hero/intro text, hide/show/reorder widgets, add a Text section and Quote, then Save. Refresh the page and verify the configuration remains in this browser. Test Discard separately.
5. Switch to Horizontal, save and verify all filtered milestones appear in chronological order in the horizontal rail. Test arrow buttons, shift/trackpad, keyboard focus/arrows and phone swipe. Then switch back to Vertical and verify the original vertical structure returns.
6. Open details and edit a milestone in both layouts. Ensure the page builder does not interfere with the existing milestone editor.
7. Keep this handoff updated for every future iteration. GitHub/commit/push remains separate and requires explicit authorization; none was attempted here.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Full project tests: `npm test`.
- Production build: `npm run build`.
- Local preview: `npm run dev`; open the printed Network URL on a phone on the same trusted Wi-Fi.
- Stop Vite with `Ctrl+C`. This is a local testing preview, not public hosting.

### Session 026 — Timeline text navigation, mobile gradient correction and dropdown arrow spacing (local only)

**Date:** 10 November 2026.

**Feature/task:** Add the user's requested plain-text cross-page navigation at the upper-left of the Timeline; correct the crimson gradient behavior on phones; and move the category select chevron farther from the right border.

**Scope confirmation:** Timeline pilot only. This is a lightweight set of navigation links within the Timeline page, not a replacement for the overall site navbar or ownership of other teams' pages. No other page components, shared root `style.css`, milestone data, star particle behavior, page-builder state, orientation settings, production admin/authentication, database, deployment or GitHub state were changed. No commit or push was made.

**Changes made:**
- Added a small, left-aligned row of plain off-white text links before the preview toolbar: Home, About Us, Core Team, Timeline, FAQ and Contact Us. There are no boxed buttons, cards or pill backgrounds. Links wrap cleanly on narrow screens; Timeline is marked as the current page and keyboard focus remains visible.
- Added conventional route destinations: `/`, `/about-us`, `/core-team`, `/timeline`, `/faq` and `/contact-us`. These are integration route contracts, not evidence that the other page routes already exist. The isolated Timeline pilot currently contains only the Timeline section; when the full site router/pages are merged, the team must connect or adjust these destinations to the actual routes. This keeps the Timeline group from implementing other groups' pages.
- Restored direct VisualViewport synchronization for the **gradient layer only**. On initial load and VisualViewport/window scroll or resize events, App.jsx now applies the current visible viewport's `left`, `top`, `width` and `height` to `.timeline-atmosphere`. The full-document star canvas is not resized or repositioned by this helper. This avoids the previous mobile pinch/pan failure where a fixed gradient could be left behind relative to the visible phone viewport.
- Added a mobile-specific broad crimson gradient treatment with wider radial fields and stable opacity (no gradient transform animation on narrow screens). Desktop gradient rules remain unchanged. The charcoal base remains present underneath the wash.
- Replaced the category select's browser-native chevron with a small custom down-chevron; the control now reserves 54px on the right and positions the icon 18px from the edge. This directly addresses the arrow placement shown in the 1:02 PM screenshot while retaining the 46px control height.

**Files modified:**
- `react-pilot/src/App.jsx` — navigation links and VisualViewport-only gradient bounds synchronization.
- `react-pilot/src/timeline.css` — phone-specific broad, stable crimson gradient treatment.
- `react-pilot/src/timelineModular.css` — plain-text navigation styling and inset select chevron/right padding.
- `react-pilot/src/timelinePageBuilderDesign.test.js` — regression tests for route links, current-page accessibility, mobile gradient alignment and select arrow spacing.
- `AI_HANDOFF.md` — this iteration record.

**Verification performed in the isolated working bundle:**
- `node --test timelineBackground.test.js timelinePageConfig.test.js timelinePageBuilderDesign.test.js`: PASS, 46/46 tests, 0 failures.
- TypeScript JSX transpile diagnostics: PASS, 0 errors for `App.jsx` and `TimelinePageBuilder.jsx`.
- PostCSS parse: PASS for `timeline.css` (304 rules) and `timelineModular.css` (122 rules).
- Selector audit: 0 unscoped non-keyframe selectors in either Timeline stylesheet.
- The automated tests verify that VisualViewport events update the gradient layer, that the phone CSS uses the additional crimson radial fields, that the select arrow is custom/inset, and that the requested link destinations are present.
- Full Vite `npm run build` was NOT run because this incremental working bundle does not contain the complete project shell, package manifest or installed project dependencies. No live browser screenshot or physical phone test was performed. Do not claim the phone visual issue is confirmed fixed until it is checked on the user's phone.

**Known limitations / integration requirements:**
- The non-Timeline destinations are planned route slugs. They must be matched to the actual pages/routes created by the other groups before integration or production. The Timeline pilot itself cannot render those pages.
- Phone gradient appearance still needs an actual device check in normal scroll and during pinch-zoom/pan. Code-level tests cannot confirm how a mobile browser paints the gradient.
- The category arrow spacing is verified in CSS, but must be reviewed in the full page at desktop and phone widths.
- The overall admin system is still not implemented. The current local Admin Preview/page builder is a browser-only prototype; the user's next planned phase is the real admin system after this visual/navigation pass is approved.

**Next local checks:**
1. Back up the five modified files, then apply the Session 026 patch at the `grid_website` repository root.
2. From `react-pilot`, run `npm test`, `npm run build` and `npm run dev` in the complete project.
3. On desktop, confirm the text nav is at the upper-left with no boxes and all six links have the expected destination URLs.
4. On phone, verify the gradient remains visible during normal vertical scrolling, address-bar expand/collapse and pinch-zoom/pan. Confirm it does not become a solid red wash or disappear.
5. Inspect the category dropdown at narrow phone and desktop widths; confirm the down-chevron has comfortable right padding and the 46px control height remains intact.
6. Confirm the vertical/horizontal page-builder choice, widget editing, filters, modal and milestone editor still behave as before.
7. Once this pass is approved, begin planning the real shared admin system. Keep authentication, permissions, API and persistent storage separate from the current local preview controls.
8. Update this handoff after every further meaningful iteration. GitHub/commit/push remains separate and needs explicit authorization; none was attempted here.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Complete project tests: `npm test`.
- Production build: `npm run build`.
- Local preview: `npm run dev`; use the printed Network URL on a phone on the same trusted Wi-Fi.
- Stop Vite with `Ctrl+C`. This remains a local testing pilot, not public hosting.

### Session 027 — Top-left navigation refinement (local only)

**Date:** 10 November 2026.

**Feature/task:** Refine the plain-text GRID page navigation from Session 026 based on the user's screenshot: move the links farther into the upper-left corner, make them slightly larger and add a very subtle white glow.

**Scope confirmation:** A navigation-only visual iteration. The modular page builder, vertical/horizontal Timeline choice, milestone data and editing, category filter, category dropdown arrow, crimson atmosphere/gradient, white-star canvas, mobile viewport handling and existing destinations are unchanged. No work was done on the other teams' pages, production admin/authentication, shared database, deployment or GitHub. No commit or push was made.

**Changes made:**
- Moved the navigation element outside the centered `.timeline-container` so its position is anchored to the Timeline page shell rather than the centered content column. This corrects the screenshot issue where the links appeared around the middle of the page instead of at the upper-left.
- Positioned it at a small responsive inset from the shell's top-left corner: desktop uses a clamped 12–20px top offset and 14–24px left offset; the narrow-screen rule uses 12px top and 14px left.
- Increased link type from `0.82rem` to `0.92rem` on desktop and set the mobile size to `0.84rem` (up from `0.78rem`).
- Added a very soft white `text-shadow` (`0 0 7px rgba(255, 255, 255, 0.13)`). The links remain plain text with no boxes, backgrounds or borders. Existing accent hover/focus treatment is retained.
- Updated regression assertions to verify the navigation is a sibling before the centered content container, has absolute top-left positioning, uses the slightly larger type and retains the subtle white glow.

**Files modified:**
- `react-pilot/src/App.jsx` — moved the navigation element to be a direct child of `.timeline-shell`, outside `.timeline-container`.
- `react-pilot/src/timelineModular.css` — top-left positioning, responsive offsets, slightly larger typography and subtle white glow.
- `react-pilot/src/timelinePageBuilderDesign.test.js` — layout and CSS regression checks for the new navigation placement and appearance.
- `AI_HANDOFF.md` — this session record.

**Verification performed in the isolated working bundle:**
- `node --test timelineBackground.test.js timelinePageConfig.test.js timelinePageBuilderDesign.test.js`: PASS, 46/46 tests, 0 failures.
- TypeScript JSX transpile diagnostics: PASS, 0 errors for `App.jsx` and `TimelinePageBuilder.jsx`.
- PostCSS parse: PASS for `timeline.css` and `timelineModular.css`.
- Selector-scope audit: PASS, zero unscoped class selectors in either Timeline stylesheet.
- Full Vite `npm run build` was NOT run because this incremental bundle does not include the complete project manifest/shell or installed project dependencies. No live browser screenshot or physical phone test was performed.

**Known limitations / next checks:**
- Confirm on desktop that the links sit close to the top-left corner, remain legible over the stars/gradient and have only a barely visible glow.
- Confirm on a narrow phone that the links wrap cleanly without overlapping the hero/toolbar and remain easy to tap.
- Confirm links still navigate to the expected route slugs. Non-Timeline destinations remain integration contracts until the other teams' pages and router are connected.
- The glow and size are intentionally restrained; adjust only after reviewing the new build on the actual device.

**Next local checks:**
1. Back up `AI_HANDOFF.md`, `react-pilot/src/App.jsx`, `react-pilot/src/timelineModular.css` and `react-pilot/src/timelinePageBuilderDesign.test.js`.
2. Apply the Session 027 patch at the `grid_website` repository root.
3. From `react-pilot`, run `npm test`, `npm run build` and `npm run dev` in the complete project.
4. Check desktop and phone: top-left offset, text size, very faint glow, wrapping, tap targets and separation from the page content.
5. Keep `AI_HANDOFF.md` updated after every future iteration. GitHub/commit/push remains separate and requires explicit authorization; none was attempted here.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Complete project tests: `npm test`.
- Production build: `npm run build`.
- Local preview: `npm run dev`; use the printed Network URL on a phone on the same trusted Wi-Fi.
- Stop Vite with `Ctrl+C`. This remains a local testing pilot, not public hosting.


### Session 028 — Slightly smaller corner navigation and document-painted mobile gradient (local only)

**Date:** 10 November 2026.

**Feature/task:** Make the Session 027 navigation text just a little smaller while preserving its top-left position and very subtle white glow. Address the reported mobile red-gradient instability without changing the overall desktop appearance or the starfield.

**Scope confirmation:** A small visual and mobile-background iteration only. The modular page builder, vertical/horizontal Timeline setting, milestone editing, filters, modal, dropdown chevron, white starfield, page content and navigation destinations are preserved. No shared root stylesheet, other teams' pages, production admin/authentication, database, hosting, remote repository or GitHub branch was changed. No commit or push was made.

**Changes made:**
- Reduced desktop navigation typography from `0.92rem` to `0.88rem` and mobile typography from `0.84rem` to `0.82rem`.
- Preserved the Session 027 corner positioning, plain-text link treatment, link spacing and faint white text glow.
- Replaced the mobile fixed-layer gradient approach. On screens at or below 760px, the crimson wash is now drawn using layered radial backgrounds directly on `.timeline-shell`, with `background-attachment: scroll`. The gradient therefore travels with the document rather than being resized/repositioned against mobile VisualViewport bounds.
- Hid `.timeline-atmosphere` on mobile because the page background now owns the phone gradient. Desktop continues using the existing fixed animated atmosphere; desktop gradient styling was not changed.
- Removed the JavaScript that wrote VisualViewport `left`, `top`, `width` and `height` values to the gradient element. VisualViewport listeners and zoom calculations remain in place for star visibility/zoom presentation; the star canvas logic was not intentionally changed.
- Updated the page-builder design regression test to require the page-scrolling mobile gradient and reject the old fixed-layer synchronization. Updated nav assertions to the smaller font sizes.

**Files modified:**
- `react-pilot/src/App.jsx` — removed gradient-only VisualViewport style synchronization and the now-unneeded atmosphere ref; retained VisualViewport zoom handling for stars.
- `react-pilot/src/timeline.css` — mobile page-background gradient and hidden mobile atmosphere layer; desktop atmosphere remains unchanged.
- `react-pilot/src/timelineModular.css` — slightly smaller nav typography; corner position and glow remain as approved.
- `react-pilot/src/timelinePageBuilderDesign.test.js` — regression coverage for page-scrolling mobile gradient and nav sizes.
- `AI_HANDOFF.md` — this iteration record.

**Verification performed in the isolated working bundle:**
- `node --test timelineBackground.test.js timelinePageBuilderDesign.test.js`: PASS, 32/32 tests, 0 failures.
- TypeScript JSX transpile diagnostics for `App.jsx` and `TimelinePageBuilder.jsx`: PASS, 0 errors.
- PostCSS parse for `timeline.css` and `timelineModular.css`: PASS.
- Selector-scope audit for both stylesheets: PASS, 0 unscoped selectors.
- The older broad `timelineDesign.test.js` was not counted: the incremental working bundle does not contain its required `main.jsx`, so Node stopped at a missing-file error before running those tests. This is a test-fixture limitation, not a code assertion failure.
- Full project `npm test` and `npm run build` were NOT run because the incremental bundle does not contain the full application shell, package manifest or installed dependencies.
- No live browser screenshot or physical phone rendering was available. The revised mobile gradient strategy is code-verified but its visual result still requires checking on the user's phone.

**Next local checks:**
1. Back up `AI_HANDOFF.md`, `react-pilot/src/App.jsx`, `react-pilot/src/timeline.css`, `react-pilot/src/timelineModular.css` and `react-pilot/src/timelinePageBuilderDesign.test.js`.
2. Apply the Session 028 patch at the `grid_website` repository root.
3. From `react-pilot`, run `npm test`, `npm run build` and `npm run dev` in the complete project.
4. On the phone at normal zoom, scroll from top to bottom and verify the red gradient stays attached to the page, does not jump/disappear as browser chrome changes, and remains subtly distributed. Check pinch-zoom and pan as well.
5. Confirm the navigation remains anchored at the same top-left position, with the slightly smaller type and same faint glow.
6. Keep `AI_HANDOFF.md` updated after every further meaningful iteration. GitHub/commit/push remains separate and requires explicit authorization; none was attempted here.

**Run/test instructions:**
- From repository root: `cd react-pilot`.
- Complete project tests: `npm test`.
- Production build: `npm run build`.
- Local preview: `npm run dev`; use the printed Network URL on the phone while it is on the same trusted Wi-Fi.
- Stop Vite with `Ctrl+C`. This remains a local testing pilot, not public hosting.

---

## Session 029 — mobile-only gradient repair and navigation containment

**Date:** 10 November 2026.

**Task:** The user clarified that the desktop/PC version is already correct and must remain unchanged. The remaining background problem is specifically on phones. The supplied phone screenshot showed the mobile page appearing almost entirely black despite the previous Session 028 page-background gradient. The screenshot also showed the last navigation item wrapping onto a second row and colliding visually with the Admin Preview panel.

**Scope:** Mobile breakpoint only (`max-width: 760px`). Do not modify desktop gradient, desktop navigation, starfield code, page-builder functionality, Timeline layout, milestones, dropdown, or other project sections.

**Changes:**
- Replaced the previous mobile `background-image` on `.timeline-shell` with a full-document `.timeline-shell::before` atmospheric layer. This layer is positioned absolutely inside the Timeline shell and uses stronger, broad crimson/deep-maroon radial zones so it remains visibly present as the document scrolls.
- Kept the mobile atmosphere detached from `VisualViewport` resizing and scrolling. The mobile-only fixed `.timeline-atmosphere` remains hidden; the white-star canvas remains a separate layer.
- Left all desktop rules before the mobile media query unchanged. Desktop retains the existing fixed, animated `.timeline-atmosphere` and original crimson gradient.
- Updated mobile-only navigation to remain on one line with horizontal touch scrolling and hidden scrollbar. This prevents “Contact Us” wrapping into a second row over the Admin Preview panel in the supplied screenshot. Desktop navigation is unchanged.
- Added regression checks for the full-page mobile pseudo-layer, stronger mobile crimson stop, unchanged desktop fixed atmosphere, and single-line horizontally scrollable mobile navigation.

**Files changed:**
- `react-pilot/src/timeline.css` — mobile-only full-document gradient pseudo-layer.
- `react-pilot/src/timelineModular.css` — mobile-only one-line scrollable navigation.
- `react-pilot/src/timelinePageBuilderDesign.test.js` — mobile gradient and mobile nav regression tests.
- `AI_HANDOFF.md` — this session record.

**Files intentionally not changed:**
- `react-pilot/src/App.jsx` — no JavaScript/VisualViewport or star-canvas changes.
- `react-pilot/src/timelineBackground.js` — no starfield changes.
- `react-pilot/src/timelinePageConfig.js` and `TimelinePageBuilder.jsx` — no modular builder changes.
- Shared root `style.css`, desktop styling, other teams' pages and production systems.

**Verification:**
- `node --test timelineBackground.test.js timelinePageBuilderDesign.test.js`: PASS, 33/33 tests, 0 failures.
- TypeScript JSX transpile diagnostics for `App.jsx`: PASS, 0 errors.
- PostCSS parse for `timeline.css` and `timelineModular.css`: PASS.
- CSS selector-scope audit for both files: PASS, 0 unscoped selectors.
- Full Vite build and actual physical phone rendering were not run from this incremental patch. The screenshot confirms the previous mobile gradient did not render visibly enough; Session 029 is a code-level correction awaiting a fresh phone check.
- Desktop appearance was not altered by the changed selectors, but this has not been re-rendered in a browser after Session 029.

**Next local checks:**
1. Back up the listed CSS, test and `AI_HANDOFF.md` files.
2. Apply Session 029 at the `grid_website` repository root.
3. From `react-pilot`, run `npm test`, `npm run build`, and `npm run dev`.
4. On a phone, inspect the top, middle and bottom of the page at normal zoom. Confirm a visible but restrained maroon/crimson wash remains behind content while scrolling and does not jump when browser chrome changes.
5. Confirm the six navigation labels remain on one line; swipe the navigation row horizontally to reach the last links on narrower screens.
6. Check desktop once to confirm the existing gradient remains visually unchanged.
7. Continue updating `AI_HANDOFF.md` on every meaningful iteration. This remains local-only; no Git commit or push was made.

**Apply commands:**
```bash
cd ~/Downloads/grid_website
mkdir -p ~/Downloads/grid_session029_backup
cp AI_HANDOFF.md react-pilot/src/timeline.css react-pilot/src/timelineModular.css react-pilot/src/timelinePageBuilderDesign.test.js ~/Downloads/grid_session029_backup/
unzip -o ~/Downloads/grid_timeline_session029_mobile_only_gradient_nav.zip
cd react-pilot
npm test
npm run build
npm run dev
```

---

## Session 030 — document-space atmosphere and background validation

**Date:** 10 November 2026.

**Task:** Prepare the existing Timeline implementation for review on `feature/Timeline`. Resolve contradictory fixed-layer/document-height background behavior, remove the five stale background assertions, and validate all source tests and the production build.

**Changes made:**
- Changed the desktop `.timeline-atmosphere` and `.timeline-ambience` layers from viewport-fixed positioning to absolute positioning within `.timeline-shell`. Both now share document coordinates with the page-height star canvas. The ambience layer explicitly fills the shell.
- Kept the mobile full-document `.timeline-shell::before` crimson gradient. The atmosphere wrapper remains available to host the canvas; only its duplicate `.ambient-glow` is hidden on mobile. White stars therefore remain visible across the phone document.
- Kept VisualViewport metrics for pinch-zoom star density and visible canvas drawing. They no longer position background layers. No star-connection rendering exists.
- Updated regression assertions that required the superseded fixed-layer architecture or old gradient coordinates. The assertions now check document-space layers, mobile gradient behavior, visible canvas structure, and current crimson gradient values.
- Removed trailing whitespace in `App.jsx` and corrected the background CSS comments.

**Files changed in this session:**
- `react-pilot/src/timeline.css`
- `react-pilot/src/timelineDesign.test.js`
- `react-pilot/src/timelinePageBuilderDesign.test.js`
- `react-pilot/src/App.jsx` (whitespace only)
- `AI_HANDOFF.md`

**Verification performed:**
- `node --test src/*.test.js` from `react-pilot`: PASS, 86/86 tests across every test file in `src/`.
- `npm run build` from `react-pilot`: PASS; Vite produced the production bundle.
- `node ../scripts/check-ai-handoff.mjs` from `react-pilot`: PASS; the updated handoff is staged.
- `git diff --check` and `git diff --cached --check`: PASS after staging the session edits.
- No live browser, desktop viewport, physical phone, or pinch-zoom rendering check was performed. Automated tests cover source structure and helper behavior, not rendered mobile browser behavior.

**Current status and next steps:**
- The background layers now use a consistent document-space model, and source tests plus production build pass.
- Review the actual page on desktop and phone, including long scrolling and pinch zoom, before treating visual behavior as device-verified.
- Existing staged Timeline files are preserved. The unrelated `SESSION025_README.md` through `SESSION029_README.md` files remain excluded.
- Confirm `feature/Timeline`, review the complete staged file list and whitespace checks, then wait for contributor review. No commit or push was made.

**Run/test instructions:**
- From the repository root: `cd react-pilot`.
- Run every source test: `node --test src/*.test.js`.
- Run the configured test command: `npm test` (currently covers `timelineValidation.test.js`).
- Build production assets: `npm run build`.
- Start the local preview server: `npm run dev`.

---

## Session 032 — remove mobile gradient and refine Timeline spacing

**Date:** 10 November 2026.

**Task:** Remove the mobile-only red gradient, preserve the desktop gradient and white starfield, refine the Timeline's spacing on desktop and mobile, and prepare the authorized `feature/Timeline` commit and push.

**Reference and scope checks:**
- Read the current handoff through Sessions 030 and 031 and inspected staged, unstaged and untracked changes before editing.
- Compared local root `style.css` with GitHub `feature/Timeline/style.css`. Both have Git blob SHA `cdd002b539a068e557f50ce969e4adcb1dd2727c`; the shared stylesheet is unchanged.
- Kept work within Timeline app files, their relevant tests and this handoff. The pre-existing staged project files and untracked `SESSION025_README.md` through `SESSION029_README.md` were preserved.

**Changes made:**
- Removed the mobile `.timeline-shell::before` gradient layer. Mobile uses the shared `--bg-void` charcoal base and hides only `.ambient-glow`; the separate document-sized star canvas remains visible. The stars remain independent white dots without connecting lines.
- Left the desktop `.ambient-glow` radial gradient and animation rules unchanged.
- Reduced compounded spacing from shell/hero padding, page-widget gaps, section padding, filters, timeline groups and card rows. Used the shared GRID spacing variables and aligned the Admin Preview width with the Timeline container at mobile breakpoints. Tightened desktop and mobile navigation gaps to the shared rhythm.
- Added regression checks for the mobile charcoal-only background, retained desktop gradient declarations, star canvas visibility, Admin Preview position/width, and responsive shared-token spacing.

**Files changed in this session:**
- `react-pilot/src/App.jsx` — includes the unstaged Session 031 Admin Preview relocation.
- `react-pilot/src/timeline.css` — mobile gradient removal and responsive layout rhythm.
- `react-pilot/src/timelineModular.css` — widget, filter, toolbar and navigation spacing.
- `react-pilot/src/timelinePageBuilderDesign.test.js` — mobile background, desktop gradient, admin placement and spacing regressions.
- `AI_HANDOFF.md` — this session record.

**Verification performed:**
- `node --test src/*.test.js` from `react-pilot`: PASS, 88/88 tests across every test file under `src/`.
- `npm run build` from `react-pilot`: PASS; Vite produced the production bundle.
- `node scripts/check-ai-handoff.mjs` from the repository root: PASS.
- `git diff --check` and `git diff --cached --check`: PASS.
- Inspected the working diff; root `style.css` has no diff, desktop gradient declarations are unchanged, mobile CSS has no red gradient, and Admin Preview remains the final Timeline section.
- No live desktop browser or physical-phone visual check was performed.

**Current status and next steps:**
- The intended Timeline changes from Sessions 031 and 032 and the pre-existing staged pilot were committed as `33905d3d3b4507263e9f067f219dddc6199ff541` (`Complete Timeline background and layout refinements`) on `feature/Timeline` and pushed successfully to `origin/feature/Timeline` without force.
- The local branch and `origin/feature/Timeline` point to the same commit. The only remaining untracked files are `SESSION025_README.md` through `SESSION029_README.md`; they were preserved and excluded.
- Manually review desktop spacing and mobile top-to-bottom spacing, orientation changes, narrow widths, starfield visibility and admin interactions. No actual browser/phone visual review has been performed.

**Run/test instructions:**
- From the repository root: `cd react-pilot`.
- Run all source tests: `node --test src/*.test.js`.
- Run the configured validation tests: `npm test`.
- Build production assets: `npm run build`.
- Start the local preview server: `npm run dev`.

---

## Session 033 — record Timeline publication

**Date:** 10 November 2026.

**Task:** Update this handoff after the authorized Timeline commit and push so the current branch status and remaining work are accurate.

**Changes made:**
- Recorded commit `33905d3d3b4507263e9f067f219dddc6199ff541` and successful push to `origin/feature/Timeline` in Session 032.
- Recorded that the branch and upstream match and that the five untracked SESSION README files remain preserved and excluded.
- Kept physical browser/phone rendering as pending visual review.

**Files changed:**
- `AI_HANDOFF.md` only.

**Verification performed:**
- `node scripts/check-ai-handoff.mjs`: PASS after staging the updated handoff.
- `git diff --check` and `git diff --cached --check`: PASS.
- No source tests or production build were rerun because this follow-up changes documentation only; Session 032 records the passing 88/88 tests and production build.

**Current status and next steps:**
- Session 032's Timeline implementation is committed and pushed to `feature/Timeline`.
- Manually review the desktop and mobile layout, scroll the full mobile page, and check orientation changes, pinch zoom, star visibility, readability and Admin Preview interactions.
- Preserve the five untracked SESSION README files; no commit or push of those files is authorized.

**Run/test instructions:**
- From the repository root: `cd react-pilot`.
- Run all source tests: `node --test src/*.test.js`.
- Build production assets: `npm run build`.
- Start the local preview server: `npm run dev`.

---

## Session 031 — full-length mobile gradient and Admin Preview placement

**Date:** 10 November 2026.

**Task:** Extend the mobile crimson treatment through the full Timeline document and move Admin Preview to the final position inside the Timeline page, while preserving desktop background appearance and existing admin features.

**Cause found:** The mobile pseudo-element already covered the shell, but its background consisted only of three non-repeating radial gradients with fixed 520–600px ellipses. Those local gradients left charcoal areas across longer pages. The Admin Preview toolbar, warning, controls, page builder and editor were rendered before the page widgets, so the preview section appeared near the top.

**Changes made:**
- Replaced the fixed-height mobile radial-only wash with a continuous linear crimson-to-maroon gradient spanning 0–100% of the full-shell pseudo-element. Kept responsive radial highlights for depth. The layer remains absolute with `inset: 0` and `pointer-events: none`; it does not use VisualViewport or address-bar dimensions.
- Kept the white-star canvas on its independent document-sized layer. No star connection lines were added. Desktop gradient rules were not changed.
- Moved the Admin Preview toolbar, toggle, warning, notices, management actions, page builder and milestone editor into `.timeline-admin-preview`, after Timeline widgets and the milestone detail component. Existing handlers, state and conditional behavior were preserved. The Timeline detail dialog remains available before this final section in DOM order.
- Added regression coverage for the continuous full-document mobile gradient, canvas visibility, pointer pass-through and Admin Preview DOM placement/features.

**Files changed:**
- `react-pilot/src/App.jsx`
- `react-pilot/src/timeline.css`
- `react-pilot/src/timelinePageBuilderDesign.test.js`
- `AI_HANDOFF.md`

**Verification performed:**
- `node --test src/*.test.js` from `react-pilot`: PASS, 87/87 tests across all source test files.
- `npm run build` from `react-pilot`: PASS; Vite produced the production bundle.
- `node scripts/check-ai-handoff.mjs` from the repository root: PASS.
- `git diff --check` and `git diff --cached --check`: PASS.
- Root `style.css` has no diff. Existing staged changes and untracked SESSION README files were preserved; no commit or push was made.

**Remaining limitations:**
- No live browser or physical-phone rendering check was performed. Review mobile scrolling from page top to bottom, different phone heights, orientation changes, browser address-bar changes and pinch zoom. Confirm the bottom wash remains continuous and content stays legible and interactive.
- The desktop background CSS was unchanged; the Admin Preview panel is intentionally relocated on desktop as well, per the placement requirement.

**Run/test instructions:**
- From the repository root: `cd react-pilot`.
- Run all source tests: `node --test src/*.test.js`.
- Run the configured validation tests: `npm test`.
- Build production assets: `npm run build`.
- Start the local preview server: `npm run dev`.

---

## Session 034 — correct current status after Timeline publication

**Date:** 10 November 2026.

**Feature/task:** Documentation-only correction of the current status, pre-commit hook evidence and remaining work after Sessions 032 and 033 were successfully published.

**Why and implementation:**
- Section 9 still contained stale Session 023 implementation instructions, old pending-build statements and a false claim that the Timeline work had not been committed or pushed. Replaced its status and next steps with the verified current pilot state, actual test/build results, pushed implementation and handoff commits, remaining production work and required team review before a future merge to `main`.
- Section 8 said the pre-commit hook had not been installed in the actual clone. Current-clone evidence confirms `core.hooksPath` is `.githooks`, `.githooks/pre-commit` is executable, and the latest project commits passed the handoff check. Corrected Section 8 accordingly.
- Preserved all earlier session entries. No Timeline source, CSS, tests, shared stylesheet or SESSION README file was changed.

**Files changed:**
- `AI_HANDOFF.md` only.

**Working currently:**
- The Timeline pilot is pushed to `feature/Timeline`; it is not merged into `main` or deployed.
- Before preparing Session 034, fetching `origin/feature/Timeline` confirmed local `HEAD` and the remote branch both at `623953a51d383ec5a8d4d0c5ac443f9ba5c72c4a`, with 0 ahead and 0 behind.
- The five untracked SESSION README files remain preserved and excluded.

**Verification:**
- Source tests and production build were not rerun because this session changes documentation only. The last code verification in Session 032 was 88/88 source tests passing and a successful Vite production build.
- AI handoff validation passed with `node scripts/check-ai-handoff.mjs`; `git diff --check` and `git diff --cached --check` passed. No source tests or production build are claimed for Session 034.
- Current-clone hook configuration and executable status were inspected; the Session 034 commit hook runs as part of commit verification.

**Remaining work:**
- Perform desktop browser and physical-phone visual reviews, including mobile scrolling, narrow widths, orientation changes, star visibility and Admin Preview interactions.
- Replace demo milestones with verified GRID content; coordinate production authentication, shared API/storage and final main-site integration approval with the GRID team.
- Await team review before any merge into `main`. No merge or deployment is part of this session.

**Run/test instructions:**
- From the repository root: `cd react-pilot`.
- Run all source tests: `node --test src/*.test.js`.
- Build production assets: `npm run build`.
- Start the local preview server: `npm run dev`.

---

## Session 035 — expand Timeline review and readiness roadmap

**Date:** 10 November 2026.

**Task:** Planning and handoff update to make the Timeline's review, content, branding, visual QA and production-readiness work actionable for future contributors.

**Changes made:**
- Verified PR #6 is open, targets `main` from `feature/Timeline`, and is not merged. Added its current status to Section 9.
- Replaced the short next-actions list with a prioritised, pending-only checklist covering lead review and approval, a proposed Timeline content-management interface, historical content collection, official logo/branding, visual review, production integration/readiness and optional future work.
- Clarified that Admin Preview remains a local UI prototype and that the proposed management system is not approved or built. Added a suggested verified milestone content format and preserved the Timeline/Event Archive scope distinction.
- No source code, CSS, tests, shared website files or SESSION README files were changed.

**Files changed:**
- `AI_HANDOFF.md` only.

**Verification performed:**
- PR #6 metadata was checked through the GitHub connector: state open, base `main`, head `feature/Timeline`, not merged.
- Local branch and origin matched at `6ce742bc9ae604d4deee9a106668bfe651718f00` before editing; the five untracked SESSION README files were preserved.
- `node scripts/check-ai-handoff.mjs`: PASS after staging the updated handoff. `git diff --check` and `git diff --cached --check`: PASS.
- No source tests or production build were run or are claimed for Session 035.

**Remaining work:**
- All Section 9 roadmap items remain pending until completed and verified; no team decision or approval is implied by this planning update.
- Review PR #6 with the lead and coordinate Timeline-only implementation and integration decisions with the GRID teams that own shared systems.

**Run/test instructions:**
- From the repository root: `cd react-pilot`.
- Run all source tests: `node --test src/*.test.js`.
- Build production assets: `npm run build`.
- Start the local preview server: `npm run dev`.
