---
sidebar_position: 2
title: The GPU Reality
---

# The GPU Reality on Apple Silicon

This page will cover the most important practical constraint of the course: why the model server must run **natively** on Apple Silicon, not inside a container.

**Content coming soon** — this stub keeps the sidebar valid while Setup content is authored in a later pass.

Topics will include:
- Why macOS Hypervisor.framework exposes no virtual GPU
- The universal pattern: native Ollama (Metal) + containerized app
- How `host.docker.internal:11434` bridges the two
- Windows + NVIDIA: when containers *can* serve the model
- The `OLLAMA_HOST` environment variable and listening on all interfaces
