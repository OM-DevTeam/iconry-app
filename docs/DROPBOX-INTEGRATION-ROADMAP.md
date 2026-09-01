# Dropbox Integration Roadmap

## Goal

Let a team member open their Dropbox from Iconry, select one or more SVG icons,
edit them in the existing browser-based workflow, and optionally save the
processed icons back to Dropbox.

## Product decision

Start with the **Dropbox Chooser**. It is the smallest, safest first release:
the Dropbox-hosted picker handles authentication and file selection, while
Iconry receives download links and loads selected SVGs into the current canvas.
It meets the immediate "open Dropbox from the app" need without storing a user
token.

Add direct Dropbox folder browsing and upload only when the team needs a
continuous round-trip workflow. Those capabilities require OAuth 2.0 with PKCE
and a Dropbox app registration.

## Constraints

- Iconry is a client-only Vite app deployed to GitHub Pages.
- No client secret or long-lived refresh token may be included in the app.
- Existing icon processing remains local to the browser; only user-selected
  files are requested from Dropbox.
- Dropbox approval, redirect URLs, scopes, branding, and privacy disclosures
  must be configured in the Dropbox developer console before release.

## Delivery plan

### Phase 1 — Picker proof of concept

**Outcome:** A developer can select a Dropbox SVG and load it into Iconry.

1. Create a Dropbox app and configure the GitHub Pages production URL plus the
   local Vite URL as allowed domains.
2. Add the Dropbox Chooser script using the app key supplied at build time
   (`VITE_DROPBOX_APP_KEY`); do not commit the key configuration file.
3. Add an **Open Dropbox** action beside the existing local-file import.
4. Configure the chooser for multiple `.svg` files and fetch each selected file
   into the same import pipeline used by drag-and-drop and file browsing.
5. Show clear handling for cancelled selection, inaccessible links, failed
   downloads, invalid SVG markup, and files that exceed an agreed size limit.

**Acceptance criteria**

- A user can select one or more SVGs from their Dropbox and see them in Grid
  and Single views.
- Local import behavior is unchanged.
- Cancelling the picker leaves the current icon set untouched.
- No Dropbox access token is stored by Iconry.

### Phase 2 — Production hardening

**Outcome:** The picker is reliable enough for the whole team.

1. Add unit tests around conversion of selected Dropbox files into imported
   icon records.
2. Test Chrome, Safari, Firefox, and a mobile browser, including popup-blocker
   behavior.
3. Add concise UI copy explaining that users authenticate with Dropbox and
   selected SVGs are processed locally in their browser.
4. Document setup, app-key configuration, allowed-domain changes, and rollback
   in the README or maintainer guide.
5. Confirm Dropbox app review requirements, privacy policy needs, and any
   organization-specific approval process before opening the feature broadly.

**Acceptance criteria**

- The Dropbox action is disabled with an actionable message when no app key is
  configured.
- Import failures identify the affected filename and do not discard successful
  imports in the same selection.
- A maintainer can configure staging and production without editing source.

### Phase 3 — Direct Dropbox workspace (optional)

**Outcome:** Team members can browse folders inside Iconry rather than opening
the Dropbox picker.

1. Implement OAuth 2.0 authorization-code flow with PKCE, using a redirect URL
   under the GitHub Pages site.
2. Request only required scopes: start read-only with `files.metadata.read` and
   `files.content.read`.
3. Store the short-lived session only in memory or session storage; offer an
   explicit Disconnect action and never log tokens.
4. Build a minimal folder browser: current path, back navigation, SVG-only
   filtering, multi-select, and import progress.
5. Handle authorization denial, expired sessions, revoked consent, rate limits,
   and offline states.

**Decision gate:** proceed only if Chooser users need frequent folder navigation
or want to work in shared team folders without repeatedly using the picker.

### Phase 4 — Save exports to Dropbox (optional)

**Outcome:** Processed icons can return to a chosen Dropbox folder.

1. Expand scopes to `files.content.write` only after a security and UX review.
2. Add **Save to Dropbox** for a single SVG and the ZIP export, with an explicit
   destination and overwrite/rename choice.
3. Default to creating a new versioned filename; require confirmation before
   overwriting an existing asset.
4. Display upload progress and retain a local download fallback if upload
   fails.
5. Test shared folders, write permissions, name collisions, and large exports.

## Technical shape

```
Dropbox Chooser → selected file download link → existing SVG import/validation
                                            → Iconry editor → local export

OAuth + PKCE (optional) → Dropbox API browse/download/upload → Iconry editor
```

Keep Dropbox-specific code isolated behind a small import/export adapter. The
existing SVG parser, icon state, preview, copy, and ZIP logic should remain the
single processing path for local and Dropbox-sourced files.

## Open decisions

1. Is selecting assets sufficient, or must the first release support saving to
   Dropbox as well?
2. Which shared Dropbox folders should appear in testing and who owns the
   Dropbox developer app?
3. What maximum file count and SVG file size should the picker accept?
4. Does the organization require a privacy-policy link or internal security
   review before connecting personal/team Dropbox accounts?

## Suggested rollout

Release the Chooser behind a small beta label to a few team members. Track
successful selections, import failures, and requests for folder browsing or
save-back. Use that evidence to decide whether Phases 3 and 4 justify the added
OAuth and permission complexity.
