---
sidebar_position: 2
title: 'Lab: Pack and Push a ModelKit with KitOps'
---

# Lab: Pack and Push a ModelKit with KitOps

**Goal:** Install `kit`, author a Kitfile, pack SmolLM2-135M-Instruct GGUF + a prompts config into a ModelKit, push it to an OCI registry, prove portability by unpacking on a clean directory, and selective-pull only the model layer.

**Time:** ~25 minutes (plus a one-time ~100 MB model download)
**Prerequisites:** `curl` and `docker` available; a GitHub account for the GHCR push path (or just use the local registry path — both are covered). Lab assets live in `labs/m4/`.

---

## Step 1 — Install kit

`kitops` is not in the core Homebrew formula set, and the `jozu-ai/kitops` tap is marked **untrusted** by Homebrew. The reliable install is the release binary:

```bash
curl -fsSL https://github.com/kitops-ml/kitops/releases/download/v1.15.0/kitops-darwin-arm64.tar.gz \
  | tar xz -C /tmp && sudo mv /tmp/kit /usr/local/bin/kit
```

Verify:

```bash
kit version
```

**Expected output:**
```
Version: 1.15.0
```

:::note[Homebrew alternative (untrusted tap)]

If you prefer Homebrew, you must explicitly trust the tap first:

```bash
brew tap kitops-ml/kitops
brew trust --formula kitops-ml/kitops/kitops
brew install kitops
```

The binary install above is simpler and matches what this lab was validated against.

:::

---

## Step 2 — Get the model weights

Change into the lab directory and create the `model/` folder:

```bash
cd labs/m4
mkdir -p model
```

Download SmolLM2-135M-Instruct in GGUF format (~100 MB). This is the same tiny model you served in M3 — now you're packaging it.

```bash
curl -L -o model/SmolLM2-135M-Instruct-Q4_K_M.gguf \
  "https://huggingface.co/bartowski/SmolLM2-135M-Instruct-GGUF/resolve/main/SmolLM2-135M-Instruct-Q4_K_M.gguf"
```

:::note[~100 MB download]

This is a one-time download. The `.gitignore` in `labs/m4/` excludes `model/` and `*.gguf` so the weights are never committed to the repo. Learners always download weights independently.

:::

Confirm the download:

```bash
ls -lh model/
```

**Expected output:**
```
-rw-r--r-- 1 user staff 100.6M SmolLM2-135M-Instruct-Q4_K_M.gguf
```

---

## Step 3 — Review the Kitfile and prompts

Look at the Kitfile — this is your shipping manifest:

```bash
cat Kitfile
```

**Expected output:**
```yaml
manifestVersion: "1.0.0"
package: {name: acme-docs-model, version: "1.0.0", authors: ["School of DevOps & AI"]}
model: {name: SmolLM2-135M-Instruct, path: ./model/SmolLM2-135M-Instruct-Q4_K_M.gguf}
code:  [{path: ./prompts.txt, description: "System prompt / config"}]
```

And the prompts config that will become the `code` layer:

```bash
cat prompts.txt
```

**Expected output:**
```
SYSTEM_PROMPT=You are Acme Docs Assistant, a concise and helpful assistant for Acme Corp internal documentation. Answer in plain language. If you do not know, say so.

TEMPERATURE=0.3
MAX_TOKENS=512
STOP_SEQUENCES=["<|endoftext|>"]
```

---

## Step 4 — Pack the ModelKit

Pack the current directory (`.`) using the Kitfile. Replace `<you>` with your GitHub username:

```bash
kit pack . -t ghcr.io/<you>/acme-docs-model:1.0.0
```

**Expected output:**
```
Saved model layer: sha256:c0f4f53...
Saved code layer:  sha256:be409de...
Saved configuration + manifest: sha256:a72965fa...
```

List the local kit store to confirm:

```bash
kit list
```

**Expected output:**
```
REPOSITORY                         TAG    NAME             SIZE        DIGEST
ghcr.io/<you>/acme-docs-model      1.0.0  acme-docs-model  100.5 MiB   sha256:a72965fa...
```

Three things just happened: the GGUF became a `model` layer, `prompts.txt` became a `code` layer, and the Kitfile became the OCI manifest — all signed with their SHA-256 digests.

---

## Step 5 — Log in and push to GHCR

:::warning[GHCR needs a write:packages token]

The default `gh` token does **not** include the `write:packages` scope, which GHCR requires to push images. You'll get `denied: permission_denied: token ... scopes` without it.

**Fix — option A (gh CLI):**
```bash
gh auth refresh -h github.com -s write:packages
```
Then use the token it generates:
```bash
gh auth token | kit login ghcr.io -u <your-github-username> --password-stdin
```

**Fix — option B (classic PAT):**
Create a Personal Access Token at `github.com/settings/tokens` with **`write:packages`** checked, then:
```bash
echo "<your-pat>" | kit login ghcr.io -u <your-github-username> --password-stdin
```

**Fix — option C (local registry, no token needed):**
See Step 5b below — this is what the lab validation ran.

You also need to make the GHCR package **public** in GitHub settings after the first push, or `kit unpack` on another machine will need credentials too.

:::

### Step 5a — Push to GHCR

```bash
kit push ghcr.io/<you>/acme-docs-model:1.0.0
```

**Expected output:**
```
Pushed sha256:a72965fa...
```

### Step 5b — Local registry alternative (validated offline path)

If you don't have a `write:packages` token yet, or want to test the mechanics without touching GHCR, spin up a local `registry:2` container (identical OCI API, just HTTP):

```bash
docker run -d -p 5001:5000 --name m4-registry registry:2
```

Tag and push with `--plain-http`:

```bash
kit tag ghcr.io/<you>/acme-docs-model:1.0.0 localhost:5001/acme-docs-model:1.0.0
kit push --plain-http localhost:5001/acme-docs-model:1.0.0
```

**Expected output:**
```
Pushed sha256:a72965fa...
```

The mechanics are identical — `kit` speaks the same OCI distribution API. The `--plain-http` flag is the only difference for a non-TLS registry.

---

## Step 6 — Prove portability: unpack on a clean directory

Simulate pulling on a clean machine by first removing the local copy, then unpacking from the registry.

Remove the local kit cache entry:

```bash
kit remove localhost:5001/acme-docs-model:1.0.0
```

Now unpack from the registry into a fresh directory:

```bash
kit unpack --plain-http localhost:5001/acme-docs-model:1.0.0 -d /tmp/m4-clean
```

**Expected output:**
```
Unpacking config to Kitfile / model to ./model/...gguf / code to ./prompts.txt
```

Verify the contents arrived byte-identical:

```bash
ls -lh /tmp/m4-clean/model/*.gguf
```

**Expected output:**
```
-rw-r--r-- 1 user staff 100.6M  SmolLM2-135M-Instruct-Q4_K_M.gguf
```

The Kitfile and `prompts.txt` are also restored:

```bash
ls /tmp/m4-clean/
```

**Expected output:**
```
Kitfile  model/  prompts.txt
```

That's portability: the sender packs once, any receiver unpacks the byte-identical bundle from the registry — no manual file assembly.

---

## Step 7 — Selective pull (the KitOps payoff)

A serving node needs the weights, but not the dataset or code layers. Fetch only the `model` layer
(same `--plain-http` flag as the local push/pull above):

```bash
kit unpack --plain-http localhost:5001/acme-docs-model:1.0.0 --filter=model -d ./weights-only
```

**Expected output:**
```
Unpacking to ./weights-only
Unpacking model SmolLM2-135M-Instruct to ./model/SmolLM2-135M-Instruct-Q4_K_M.gguf
```

Check what was downloaded — **only** the model layer, no `Kitfile` or `prompts.txt`:

```bash
ls ./weights-only/
```

**Expected output:**
```
model/
```

Valid `--filter` values: `model`, `code`, `docs`, `datasets`, `prompts`. Use this to route different layers to different pipeline stages: serving nodes grab `model`; eval pipelines grab `datasets`; CI linting grabs `code`.

---

## Troubleshooting

:::warning[Common failure modes]

- **`denied: permission_denied: token ... scopes`** on GHCR push — your token lacks `write:packages`. Run `gh auth refresh -h github.com -s write:packages` or use a classic PAT with `write:packages` checked. See Step 5 for options.
- **Local registry connection refused** — check that `docker run -d -p 5001:5000 registry:2` started correctly: `docker ps | grep m4-registry`.
- **`--plain-http` error on localhost push** — make sure you included `--plain-http` in both `kit push` and `kit unpack` when targeting `localhost:5001`. GHCR and public registries use TLS and don't need this flag.
- **Homebrew tap "untrusted"** — do not skip the `brew trust --formula` step if using the tap, or use the binary install from Step 1 (simpler).
- **`kit: command not found`** after install — check that `/usr/local/bin` is on your PATH, or move the binary to another directory that is on your PATH.
- **Model download stalls** — the Hugging Face URL is a redirect; re-run the `curl -L` command (the `-L` flag follows redirects). Check your internet connection.

:::

---

## Clean up

Remove the local registry container, the ModelKits from `kit`'s local storage, and the artifacts this
lab created (the ~100 MB model, the signing keys, and the unpack test directories):

```bash
# 1. stop + remove the local registry
docker rm -f m4-registry

# 2. remove the ModelKits from kit's local cache
kit remove localhost:5001/acme-docs-model:1.0.0
kit remove ghcr.io/<your-user>/acme-docs-model:1.0.0   # if you tagged for GHCR

# 3. remove the downloaded model + unpack test dirs (from labs/m4/)
rm -rf labs/m4/model /tmp/m4-clean labs/m4/weights-only
```

This keeps your disk clean — the packaged model is ~100 MB and `kit`'s cache holds a full copy too.

---

**What's next:** In M5 you'll consume this packaged ModelKit in the Acme Docs Assistant (RAG pipeline) — the serving container will unpack the model layer at startup, so there's no manual weight management.
