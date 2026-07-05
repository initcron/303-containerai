# M3B Lab Assets — LoRA/QLoRA Fine-Tuning

This directory contains reference configs for the M3B fine-tuning lab.

## Track A — Apple Silicon (MLX-LM, native)

No Docker required. Run `mlx_lm.lora` directly on the host.

- **Dataset format:** `train.jsonl` / `valid.jsonl` — one `{"messages": [...]}` object per line (chat format).
- **Reference command:** see `site/docs/m3b-finetuning/lab.md` Step A-3.
- **Model cache:** `~/.cache/huggingface/hub/`

## Track B — NVIDIA (Axolotl containerized QLoRA)

Requires Linux/WSL2 with NVIDIA GPU + Container Toolkit.

- **`axolotl-config.yaml`** — reference Axolotl YAML for TinyLlama QLoRA (copy and adapt).
- **Image:** `winglian/axolotl:main-latest`
- **Reference command:** see `site/docs/m3b-finetuning/lab.md` Step B-2.

## Adapter output

Both tracks produce an adapter in `adapter_model.safetensors` + `adapter_config.json`.
- Load hot into **Ollama** via `Modelfile ADAPTER` directive.
- Load hot into **vLLM** via `--lora-modules name=path`.
- Package with **ModelKit** (M4) for OCI artifact distribution.
