---
sidebar_position: 2
title: 'Lab: LoRA Fine-Tuning — Apple Silicon & NVIDIA Tracks'
---

# Lab: LoRA Fine-Tuning — Apple Silicon & NVIDIA Tracks

**Goal:** Produce a working LoRA adapter. Track A runs a tiny MLX-LM fine-tune natively on Apple Silicon and demonstrates the behaviour change. Track B documents the Axolotl containerized QLoRA workflow for NVIDIA hardware.

**Time:** Track A ~20 minutes · Track B ~45 minutes (GPU hardware required)

:::warning[Optional · GPU-gated module]

This module is optional. Track A requires an Apple Silicon Mac (M1/M2/M3/M4) with at least 8 GB unified memory and Python 3.10+. Track B requires an NVIDIA GPU (8 GB+ VRAM) on Linux or WSL2 — it cannot run inside a Mac container.

:::

**Prerequisites (both tracks):**
- Completed M1–M3 (you understand OCI images and model serving).
- For Track A: Python 3.10+ available natively (`python3 --version`). No Docker required.
- For Track B: Linux or WSL2 with an NVIDIA GPU; NVIDIA Container Toolkit installed; `docker` on PATH.

---

## Track A — Apple Silicon (native MLX-LM)

MLX-LM runs directly on your Mac's Neural Engine and GPU via unified memory. Do **not** use Docker for this track — there is no GPU path from a container to Metal on macOS.

### Step A-1 — Create a virtual environment and install MLX-LM

```bash
python3 -m venv ~/mlx-lora-env
source ~/mlx-lora-env/bin/activate
pip install mlx-lm
```

**Expected output (approximate — version numbers may differ):**
```
Successfully installed mlx-lm-0.24.0 mlx-core-0.26.1 ...
```

Verify:

```bash
python -c "import mlx_lm; print('mlx_lm OK')"
```

**Expected output:**
```
mlx_lm OK
```

---

### Step A-2 — Prepare the training data

LoRA fine-tuning needs examples in a standard chat format. Create a small dataset that teaches the model a consistent JSON output style — a behaviour prompt-engineering rarely locks in reliably.

```bash
mkdir -p ~/mlx-lora-lab && cd ~/mlx-lora-lab
```

Create `train.jsonl` with the following content (each line is one training example):

```bash
cat > train.jsonl << 'EOF'
{"messages": [{"role": "user", "content": "Summarise this alert: CPU above 90% for 5 minutes on web-01."}, {"role": "assistant", "content": "{\"severity\": \"high\", \"host\": \"web-01\", \"metric\": \"cpu\", \"threshold\": \"90%\", \"duration\": \"5m\", \"action\": \"page-oncall\"}"}]}
{"messages": [{"role": "user", "content": "Summarise this alert: Disk usage at 95% on db-02."}, {"role": "assistant", "content": "{\"severity\": \"critical\", \"host\": \"db-02\", \"metric\": \"disk\", \"threshold\": \"95%\", \"duration\": \"now\", \"action\": \"escalate\"}"}]}
{"messages": [{"role": "user", "content": "Summarise this alert: Memory usage at 80% on cache-01 for 10 minutes."}, {"role": "assistant", "content": "{\"severity\": \"medium\", \"host\": \"cache-01\", \"metric\": \"memory\", \"threshold\": \"80%\", \"duration\": \"10m\", \"action\": \"monitor\"}"}]}
{"messages": [{"role": "user", "content": "Summarise this alert: Network packet loss 15% on edge-03."}, {"role": "assistant", "content": "{\"severity\": \"high\", \"host\": \"edge-03\", \"metric\": \"network\", \"threshold\": \"15%\", \"duration\": \"now\", \"action\": \"page-oncall\"}"}]}
{"messages": [{"role": "user", "content": "Summarise this alert: Pod crash-looping in namespace prod, deployment api-gateway."}, {"role": "assistant", "content": "{\"severity\": \"critical\", \"host\": \"prod/api-gateway\", \"metric\": \"pod-health\", \"threshold\": \"crash-loop\", \"duration\": \"now\", \"action\": \"escalate\"}"}]}
{"messages": [{"role": "user", "content": "Summarise this alert: Response latency above 2s on checkout service for 3 minutes."}, {"role": "assistant", "content": "{\"severity\": \"high\", \"host\": \"checkout\", \"metric\": \"latency\", \"threshold\": \"2s\", \"duration\": \"3m\", \"action\": \"page-oncall\"}"}]}
{"messages": [{"role": "user", "content": "Summarise this alert: SSL certificate expires in 7 days on api.example.com."}, {"role": "assistant", "content": "{\"severity\": \"medium\", \"host\": \"api.example.com\", \"metric\": \"ssl-expiry\", \"threshold\": \"7d\", \"duration\": \"now\", \"action\": \"renew-cert\"}"}]}
{"messages": [{"role": "user", "content": "Summarise this alert: Queue depth above 10000 on rabbitmq-01 for 15 minutes."}, {"role": "assistant", "content": "{\"severity\": \"high\", \"host\": \"rabbitmq-01\", \"metric\": \"queue-depth\", \"threshold\": \"10000\", \"duration\": \"15m\", \"action\": \"page-oncall\"}"}]}
EOF
```

Copy `train.jsonl` to `valid.jsonl` for this tiny demo (a real run would use held-out examples):

```bash
cp train.jsonl valid.jsonl
```

---

### Step A-3 — Run the LoRA fine-tune

Use `Qwen/Qwen2.5-0.5B-Instruct` — a 0.5B model small enough to fine-tune on 8 GB unified memory in a few minutes. MLX-LM downloads it from Hugging Face on first run.

```bash
mlx_lm.lora \
  --model Qwen/Qwen2.5-0.5B-Instruct \
  --train \
  --data . \
  --iters 50 \
  --batch-size 1 \
  --num-layers 4 \
  --save-every 25 \
  --adapter-path ./my-adapter
```

| Flag | What it does |
|---|---|
| `--model` | Base model from HF Hub (downloaded + cached) |
| `--train` | Fine-tuning mode |
| `--data .` | Look for `train.jsonl` / `valid.jsonl` in the current directory |
| `--iters 50` | 50 gradient steps (fast; a real run uses 500–2000) |
| `--num-layers 4` | Apply LoRA to the last 4 transformer layers |
| `--adapter-path` | Where to save the resulting adapter |

:::note[Flag name varies by mlx-lm version]

Recent `mlx-lm` uses `--num-layers`; **older versions used `--lora-layers`**. If you get
`Error: No such option: --num-layers`, swap in `--lora-layers 4` (or run `mlx_lm.lora --help` to see
which your version expects).

:::

**Expected output (approximate):**
```
Loading pretrained model
Fetching 8 files: 100%|████████████████| 8/8 [00:05<00:00]
Starting training...
Iter 1: Train loss 3.412, Learning Rate 1.000e-05, It/sec 2.3
Iter 25: Train loss 1.204, ...
Saving adapter weights to ./my-adapter/adapters.safetensors
Iter 50: Train loss 0.831, ...
Saved final adapter weights to ./my-adapter/adapters.safetensors
```

Loss dropping over iterations tells you the model is learning. 50 steps on 8 examples is deliberately minimal — the point is to see the pipeline work end-to-end, not to produce a production adapter.

---

### Step A-4 — Test the adapter (before and after comparison)

**Without the adapter (base model):**

```bash
mlx_lm.generate \
  --model Qwen/Qwen2.5-0.5B-Instruct \
  --prompt "Summarise this alert: CPU above 90% for 5 minutes on web-01." \
  --max-tokens 80
```

**Expected output (approximate — base model is verbose and unstructured):**
```
The alert indicates that the CPU usage on the server web-01 has exceeded 90% for a duration
of 5 minutes. This is a significant performance issue that may require immediate attention...
```

**With the adapter:**

```bash
mlx_lm.generate \
  --model Qwen/Qwen2.5-0.5B-Instruct \
  --adapter-path ./my-adapter \
  --prompt "Summarise this alert: CPU above 90% for 5 minutes on web-01." \
  --max-tokens 80
```

**Expected output (approximate — adapter steers toward the JSON style):**
```
{"severity": "high", "host": "web-01", "metric": "cpu", "threshold": "90%", "duration": "5m", "action": "page-oncall"}
```

The adapter has nudged the model toward producing structured JSON from natural-language alerts — a behaviour the base model's prompt-following alone does not reliably produce.

---

### Step A-5 — (Optional) Fuse the adapter into the base model

To produce a single standalone model file (useful for sharing or loading with Ollama):

```bash
mlx_lm.fuse \
  --model Qwen/Qwen2.5-0.5B-Instruct \
  --adapter-path ./my-adapter \
  --save-path ./my-fused-model
```

**Expected output:**
```
Loading pretrained model
Fusing model and adapter weights...
Saving fused model to ./my-fused-model
```

The `my-fused-model/` directory is a standard Hugging Face checkpoint that Ollama or vLLM can load directly.

---

### Step A-6 — Teardown / Cleanup

```bash
# Deactivate and optionally remove the venv
deactivate
# rm -rf ~/mlx-lora-env   # uncomment to free ~1 GB

# Remove training artefacts
rm -rf ~/mlx-lora-lab

# HuggingFace model cache (remove to reclaim ~1 GB)
# rm -rf ~/.cache/huggingface/hub/models--Qwen--Qwen2.5-0.5B-Instruct
```

:::note[HuggingFace cache]

The base model is cached in `~/.cache/huggingface/hub/`. If you plan to use MLX-LM again (M4 packaging, or your own projects), keep the cache. If you're done, the `rm` above recovers the space.

:::

---

## Track B — NVIDIA (containerized QLoRA with Axolotl)

:::warning[Linux / WSL2 + NVIDIA GPU required]

This track cannot run on a Mac. It requires a Linux host (or Windows WSL2) with an NVIDIA GPU (8 GB VRAM minimum for a 3B model, 24 GB recommended for 7B), NVIDIA drivers, and the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-guide/container-toolkit/install-guide.html).

:::

### Step B-1 — Create the Axolotl config

On your NVIDIA Linux host, create a working directory:

```bash
mkdir -p ~/axolotl-lora && cd ~/axolotl-lora
```

Create `config.yaml`:

```yaml
base_model: TinyLlama/TinyLlama-1.1B-Chat-v1.0
model_type: LlamaForCausalLM
tokenizer_type: LlamaTokenizer

load_in_4bit: true          # QLoRA: quantize base to 4-bit
adapter: lora
lora_r: 16
lora_alpha: 32
lora_dropout: 0.05
lora_target_modules:
  - q_proj
  - v_proj

datasets:
  - path: mhenrichsen/alpaca_data_cleaned_small
    type: alpaca

dataset_prepared_path: last_run_prepared
val_set_size: 0.05

output_dir: ./output
sequence_len: 512
sample_packing: false

num_epochs: 1
micro_batch_size: 2
gradient_accumulation_steps: 4
learning_rate: 0.0002
lr_scheduler: cosine

bf16: true
tf32: true
```

### Step B-2 — Run the QLoRA fine-tune

```bash
docker run --rm --gpus all \
  -v $(pwd):/workspace \
  -w /workspace \
  winglian/axolotl:main-latest \
  accelerate launch -m axolotl.cli.train config.yaml
```

**Expected output (approximate — training logs with step loss):**
```
[INFO] Loading model TinyLlama/TinyLlama-1.1B-Chat-v1.0 in 4-bit...
[INFO] Applying LoRA adapters to q_proj, v_proj...
{'loss': 2.031, 'learning_rate': 0.0002, 'epoch': 0.1}
{'loss': 1.742, 'learning_rate': 0.00018, 'epoch': 0.5}
{'loss': 1.501, 'learning_rate': 0.0001, 'epoch': 1.0}
***** train metrics *****
  train_loss = 1.6821
  train_runtime = 312.45
```

Training time depends on your GPU. Expect 5–20 minutes for TinyLlama on 1 epoch.

### Step B-3 — Inspect the adapter output

```bash
ls ./output/
```

**Expected output:**
```
adapter_config.json   adapter_model.safetensors   tokenizer.json   ...
```

The `adapter_model.safetensors` file is your LoRA adapter — typically 20–80 MB. The base model weights were never modified.

### Step B-4 — Load the adapter in Ollama (optional)

```bash
# Create a Modelfile referencing the base model and adapter
cat > Modelfile << 'EOF'
FROM TinyLlama/TinyLlama-1.1B-Chat-v1.0
ADAPTER ./output
EOF

ollama create my-tinyllama-lora -f Modelfile
ollama run my-tinyllama-lora "Explain LoRA in one sentence."
```

### Step B-5 — Teardown / Cleanup

```bash
# On the NVIDIA Linux host
rm -rf ~/axolotl-lora/last_run_prepared   # intermediate dataset cache
# rm -rf ~/axolotl-lora/output            # remove adapter if done
docker image rm winglian/axolotl:main-latest   # reclaim image space (~20 GB)
```

---

## Troubleshooting

:::warning[bitsandbytes ImportError on macOS]

If you see `ImportError: bitsandbytes not found` or `CUDA required` when trying QLoRA on a Mac, you have hit the fundamental constraint: `bitsandbytes` is CUDA-only. Use Track A (MLX-LM) on Apple Silicon — it achieves the same adapter output via a different compute path.

:::

:::warning[CUDA out of memory (Track B)]

Reduce `micro_batch_size` to 1 and `sequence_len` to 256. If still failing, switch to a smaller base model (e.g., `facebook/opt-125m`). The QLoRA 4-bit quantization already cuts VRAM in half; further reductions come from batch and sequence length.

:::

:::note[Model download speed]

Both tracks download from Hugging Face on first run. On a slow connection, set `HF_HUB_OFFLINE=1` after the first download and point at your local cache. Models cache at `~/.cache/huggingface/hub/` on both macOS and Linux.

:::
