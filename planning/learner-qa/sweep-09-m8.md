# Learner-QA Sweep 09 — Module 8 · Securing & Governing AI Workloads

**Date:** 2026-07-22
**Tester role:** Strict first-time learner, published pages only, record-don't-fix.
**Source:** https://initcron.github.io/303-containerai/docs/m8-security/{lesson,lab,quiz}
**Starting state:** Fresh clone in scratchpad, Rancher Desktop running, native Ollama on :11434, zero course
containers running, m2–m7 images cached (incl. `acme-support-agent:latest`, `acme-incident-crew:latest`,
`chromadb/chroma:0.5.20`), `m7_chroma_data` volume present and untouched. Unrelated author containers
(opsmate-app, gateway-*, presidio-*) running throughout — ignored per instructions.

Note: sidebar category label is **"M8 · Securing & Governing AI Workloads"**; the task brief referred to
this module as "M8 · Securing the AI Supply Chain" — that title does not appear anywhere on the published
site. Not treated as a defect (just a naming note for whoever assigned the task).

---

## Verdict per page

| Page | Verdict |
|---|---|
| Lesson (`m8-security/lesson`) | **PASS-WITH-FINDINGS** |
| Lab (`m8-security/lab`) | **PASS-WITH-FINDINGS** (Step 5 and Step 9 are BLOCKER on networks that block Sigstore's public Rekor log — confirmed root cause, workaround exists but is undocumented on the page) |
| Quiz (`m8-security/quiz`) | **PASS** |
| Seam M7 → M8 | **PASS** |

---

## Findings

**F1 — BLOCKER (network-conditional) — Lesson §2 "The supply chain pipeline" is missing its diagram.**
Page: lesson, section "2. The supply chain pipeline". The prose says "Every image... should pass through
**this pipeline**" and "**The gate** is the critical addition" — referring to a diagram/list that is never
shown. Raw HTML at that exact spot contains a literal `<!-- -->` comment with nothing rendered between the
two paragraphs — the pipeline diagram (almost certainly a Mermaid block, per this course's own authoring
rule that "every lesson should have at least one diagram where the topic is spatial") was stripped or
failed to render and left an empty comment marker. A first-time learner reads "this pipeline" and "the
gate" with no visual referent at all. Severity: CONFUSING for the concept (the prose alone conveys the
idea), but it's a broken page element and violates the course's own diagram requirement, so flagging as
a real defect rather than cosmetic.

**F2 — BLOCKER — Lab Step 5, `cosign sign --key cosign.key` fails on networks that block `rekor.sigstore.dev`.**
Page: lab, Step 5 "Sign and verify with Cosign". Command run verbatim:
```
COSIGN_PASSWORD="" cosign sign --yes --key cosign.key \
  --allow-http-registry \
  localhost:5001/acme-support-agent:1.0.0
```
Expected (per page): `Private key written to cosign.key` / `Public key written to cosign.pub` (key-gen
step) then a successful sign with no error shown for the sign step itself.
Got (verbatim):
```
Error: signing [localhost:5001/acme-support-agent:1.0.0]: recursively signing: signing digest:
signing bundle: error signing bundle: Post "https://rekor.sigstore.dev/api/v1/log/entries":
giving up after 1 attempt(s): Post "https://rekor.sigstore.dev/api/v1/log/entries": tls: failed
to verify certificate: x509: certificate is valid for *.airtel.com, airtel.com, not rekor.sigstore.dev
```
Root cause confirmed: even **key-based** `cosign sign` attempts to upload a transparency-log entry to
the public Sigstore Rekor instance by default. This machine's network has a TLS-intercepting corporate
proxy that blocks/MITMs `rekor.sigstore.dev` specifically (confirmed via direct `curl` — `docker.io` and
`raw.githubusercontent.com` are reachable, `rekor.sigstore.dev` is not). The page's own lesson text frames
key-based signing as for "local dev, air-gapped, offline lab," implying no external network dependency —
that framing is false for this cosign version's actual default behavior.
Attempted fix `--tlog-upload=false`: rejected outright by this cosign version (v3.1.1) —
`Error: --tlog-upload=false is not supported with --signing-config or --use-signing-config`. Working
fix required fetching a custom signing-config with the tlog URL stripped (`--signing-config <file>`),
then re-running `cosign verify` with `--insecure-ignore-tlog=true` (the corresponding verify-side flag,
also undocumented on the page). Both workarounds succeeded and produced the expected
"The signatures were verified against the specified public key" text once applied. The page has zero
troubleshooting note for this failure mode, despite having admonitions for two other, less likely
Cosign issues (GHCR auth, HTTP registry). Severity is network-conditional — will not reproduce on an
open/unfiltered network — but is a hard blocker on this machine and plausible on many corporate networks.

**F3 — BLOCKER (same root cause as F2) — Lab Step 9, `secure-image.sh` aborts at [4/4] with no recovery path shown.**
Page: lab, Step 9 "Run the full pipeline with secure-image.sh". Command: `./labs/m8/secure-image.sh
acme-support-agent:latest`. Expected output shows all four stages completing with a final
`Done. SBOM + scanned + signed ...` line. Got: stages 1–3 completed and printed correctly (SBOM 96
packages; Trivy Total: 23 HIGH:19 CRITICAL:4 with `--severity CRITICAL,HIGH`; Grype scan completed), but
stage `[4/4] Sign with cosign` failed with the identical Rekor TLS error as F2, and because the script is
`set -eu` with no `|| true` on the sign/verify calls (unlike the scan steps, which do use `|| true`), the
script exits 1 and the learner never sees "Done." Positive note: the script's registry idempotency worked
correctly — `docker inspect local-registry || docker run ...` reused the container from Step 5 without a
name-collision error, which is good defensive scripting.

**F4 — CONFUSING — Lab Step 4 Trivy Expected-output block doesn't match real Trivy's output shape.**
Page: lab, Step 4, first Expected block. The page shows one combined `Total: 64 (MEDIUM: 53, HIGH: 9,
CRITICAL: 2)` line and a 6-column table (`Library | Vulnerability | Severity | Installed Version |
Fixed Version | Title`). Real Trivy 0.72.0 output (verbatim, `trivy image --scanners vuln --severity
CRITICAL,HIGH,MEDIUM $IMAGE`) actually prints: (1) a "Report Summary" table first showing per-target
vulnerability counts, (2) **two separate** `Total:` lines — one for the `debian` OS target
(`Total: 77 (MEDIUM: 54, HIGH: 19, CRITICAL: 4)`) and one for the `python-pkg` target
(`Total: 4 (MEDIUM: 4, HIGH: 0, CRITICAL: 0)`) — and (3) a 7-column table that includes a `Status` column
the page's Expected block omits. Per the task's own tolerance rule this is judged by shape, not counts —
and the shape genuinely differs (single total vs. two totals; 6 columns vs. 7). A learner comparing their
real terminal output against the page may reasonably wonder if something is broken.

**F5 — COSMETIC — Lab Step 4 Grype Expected-output block is missing columns and a summary line that no longer exist in this Grype version.**
Page: lab, Step 4, second Expected block. Page shows columns `NAME INSTALLED FIXED-IN TYPE VULNERABILITY
SEVERITY` and a closing line `Vulnerabilities by severity:  Critical 5, High 28, ...`. Real Grype 0.115.0
output (verbatim, `grype $IMAGE`) has columns `NAME INSTALLED FIXED IN TYPE VULNERABILITY SEVERITY EPSS
RISK` (two extra columns, and `FIXED IN` not `FIXED-IN`), and **no** "Vulnerabilities by severity" summary
footer line appears anywhere in stdout or stderr — that footer format appears to have been dropped from
Grype's default table renderer in a newer version. The qualitative lesson ("two scanners disagree, triage
by fixable + severity") still holds — my run found Trivy 4 Critical/19 High vs Grype 7 Critical/30 High,
same "disagreement" pattern — but the exact output shape the page shows a learner to expect is stale.

**F6 — CONFUSING — Neither lesson nor lab mentions that Syft/Trivy/Grype need `DOCKER_HOST` set explicitly on Rancher Desktop.**
Page: lab, Step 3 (first command that touches the local image store: `syft $IMAGE -o spdx-json >
sbom.spdx.json`). With only `PATH="$HOME/.rd/bin:$PATH"` set (the machine-note prefix this course's own
CLAUDE.md prescribes for `docker`/`nerdctl`), the command fails:
```
[0004] ERROR could not determine source: errors occurred attempting to resolve 'acme-support-agent:latest':
  - docker: docker not available: failed to connect to Docker daemon. Ensure Docker is running and accessible
  ...
```
even though `docker images acme-support-agent` (Step 2, run seconds earlier with the same PATH) succeeds
fine, because the `docker` CLI honors its active context (`rancher`) but Syft's internal Docker SDK client
only looks at `$DOCKER_HOST` / the default `/var/run/docker.sock`, which Rancher Desktop does not populate.
Root-caused and confirmed: exporting `DOCKER_HOST="unix:///Users/gshah/.rd/docker.sock"` fixes it
immediately for Syft, and (implicitly, since it later worked) for Trivy and Grype too. This is exactly the
kind of environment gotcha the course elsewhere is careful to call out (e.g. the Ollama
host.docker.internal note, the `~/.rd/bin` PATH note) but M8's lab prerequisites line ("Docker running
(Rancher Desktop)") doesn't mention it, and no admonition on the page covers it. Every earlier module's
labs use the `docker` CLI directly, which doesn't hit this — M8 is the first module where third-party
tools reach into the Docker socket directly, exposing the gap.

**F7 — COSMETIC — Printed teardown leaves 3 extra image tags behind (zero-cost, but incomplete).**
Page: lab, "Clean up" section. Printed commands (`docker stop local-registry && docker rm local-registry`;
`rm -f cosign.key cosign.pub sbom.spdx.json`) run clean and remove the container and generated files as
promised. Not removed, and not mentioned: the three tags created earlier in the lab —
`acme-support-agent:1.0.0`, `localhost:5001/acme-support-agent:1.0.0`,
`localhost:5001/acme-support-agent:latest`. All four tags point at the same already-cached image ID
(`82dd19beb6a8`), so there's no real disk cost, but a learner who runs `docker images` after teardown will
see tags the page never told them to expect or clean up.

**F8 — Not a course defect, recorded for completeness — `grype version` output shape differs from the page's simplified Expected block.**
Page: lab, Step 1. Expected block shows a condensed single line `grype 0.x.x`. Real output (verbatim) is
a multi-field block (`Application: grype`, `Version: 0.115.0`, `BuildDate:`, `GitCommit:`, `Platform:`,
`Syft Version:`, `Supported DB Schema:`) — same as Syft's and Cosign's real formats, which the page's
Expected block for those two tools DOES represent more fully. Minor inconsistency in how the page
compressed the four tools' outputs; harmless (page already says "versions will vary").

---

## Seam check (M7 → M8)

Prerequisite stated on the lab page: `acme-support-agent:latest` (built in **M6**, not M7) plus Docker
running plus Ollama serving `qwen2.5:1.5b`. On this machine, coming from the stated M1–M7 completed state,
`acme-support-agent:latest` was present and correctly identified by `docker images acme-support-agent`
(Step 2) with no rebuild needed — the seam holds. `acme-incident-crew:latest` (the M7 image) is never
referenced anywhere on the M8 lesson or lab pages — M8 works entirely off the M6 image, which is a slight
surprise after just finishing M7 (a learner might reasonably expect M8 to secure the M7 crew image, since
the lesson's module goal line literally says "Harden and ship the **M7 crew**"), but the lab consistently
and correctly uses `acme-support-agent` throughout, so this is not a functional break — just a naming
inconsistency between the lesson's framing ("the M7 crew") and the lab's actual target image (M6's
`acme-support-agent`). Filing this as part of F-none / observation rather than a numbered finding since it
never blocks execution, but it's worth the author's attention:

**Observation — lesson module-goal line says "Harden and ship the M7 crew" but the lab image is M6's `acme-support-agent`, not M7's `acme-incident-crew`.** No prerequisite gap for a learner who did M1–M7 in order (both images exist), but the prose promise doesn't match the lab target.

No leftover state from M7 (no dangling `local-registry`, no port 5001 in use, no stale `cosign.*` files)
interfered with M8's first steps. Clean seam.

---

## Timing per section

| Section | Wall time |
|---|---|
| Step 1 (tool version checks, already installed) | < 5s |
| Step 2 (confirm image) | < 2s |
| Step 3 (Syft SBOM, after DOCKER_HOST fix) | ~5s |
| Step 4 (Trivy + Grype scans, DB already warm) | Trivy ~0.5s, Grype ~5s |
| Step 5 (keygen, registry, push, sign+verify incl. debugging F2) | several minutes (debugging), <10s once workaround applied |
| Step 6 (sandbox, both runs) | ~2s each |
| Step 7 (guardrail eval, pure Python) | <1s |
| Step 8 (cat pipeline yaml) | instant |
| Step 9 (secure-image.sh, aborts at stage 4) | ~15s to failure |
| Teardown | <2s |

Total hands-on time excluding root-causing F2/F3: roughly 10–12 minutes, in line with a lab of this size.
The DB-freshness warning the page includes (trivy/grype first-run download can take minutes) did not apply
— both databases were already warm on this machine.

---

## Machine-local observations (facts, not findings)

- `docker` at `~/.rd/bin/docker`; PATH prefix alone is sufficient for the `docker` CLI itself, but **not**
  sufficient for Syft/Trivy/Grype's direct Docker-socket access — those additionally need
  `DOCKER_HOST=unix:///Users/gshah/.rd/docker.sock` exported (see F6).
- rtk hook mangled a plain `grep -A1` pipe (`error: unexpected argument '-A' found ... tip: use '-- -A'`);
  worked around with `rg`/Python instead. Not a course issue.
- This session's Bash tool does **not** persist working directory across separate tool calls (each call
  starts fresh); every multi-step command in this sweep was chained with `cd ... &&` inside a single call.
  One early misstep write two `cosign.key`/`cosign.pub` files into the real project repo root
  (`/Users/gshah/work/apps/learning/303-containerai/`) instead of the scratchpad clone, due to a `cd` that
  silently failed inside a call; caught via `git status --porcelain`, moved into the correct scratchpad
  location, and confirmed the real repo was left clean (`git status` shows no course-file changes).
- This network has a TLS-intercepting proxy issuing `*.airtel.com` certificates that blocks
  `rekor.sigstore.dev` specifically while allowing `hub.docker.com`, `docker.io`, and
  `raw.githubusercontent.com` — root cause of F2/F3. This is very plausibly present on other corporate
  networks running the course, making it worth the author's attention even though it won't reproduce on
  an open network.
- Installed tool versions actually exercised: syft 1.46.0, trivy 0.72.0, grype 0.115.0, cosign v3.1.1 —
  all newer than whatever versions the page's Expected-output blocks were captured against (F4/F5/F8 are
  consequences of this drift, not this machine's misconfiguration).

---

## Final machine state (after following the lab's printed teardown exactly)

- `local-registry` container: stopped and removed (per printed teardown). Confirmed absent via `docker ps -a`.
- `cosign.key`, `cosign.pub`, `sbom.spdx.json`: removed (per printed teardown, `rm -f`).
- **Not removed by the printed teardown** (F7): image tags `acme-support-agent:1.0.0`,
  `localhost:5001/acme-support-agent:1.0.0`, `localhost:5001/acme-support-agent:latest` — all aliases of
  the pre-existing `acme-support-agent:latest` image ID (`82dd19beb6a8`), zero additional disk cost.
  `registry:2` image remains cached (36MB, standard Docker caching behavior, not course-specific).
- No new course containers running. `opsmate-app`, `gateway-litellm-1`, `gateway-pg-1`,
  `gateway-analyzer-1`, `gateway-anonymizer-1` (unrelated author containers, present at session start)
  still running — untouched, as instructed.
- `m7_chroma_data` volume: present, untouched (leftover-by-design per task brief).
- Port 5001 (local-registry): free again after teardown.
- Extra files left in the scratchpad clone working directory only (never touched the real project repo
  after the one caught-and-fixed misstep): `trivy_out.txt`, `trivy_err.txt`, `grype_out.txt`,
  `grype_err.txt`, `signing_config_no_tlog.json` — QA-capture artifacts, harmless, scratchpad is throwaway.
- Real project repo (`/Users/gshah/work/apps/learning/303-containerai`) confirmed clean via
  `git status --porcelain` (only this report file added) — no course file was edited, consistent with the
  record-don't-fix mandate.
