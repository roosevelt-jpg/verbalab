<!-- PASTE THIS ENTIRE FILE'S CONTENT BELOW THE LINE INTO CURSOR AGENT AS ONE MESSAGE -->
<!-- ================================================================= -->

VOLUME 18 — DATA PLANE CLOUD

Mission: the Data Plane executes every workload inside Lugemi. Unlike the
Control Plane (Volume 17), it never manages organizations, policies, or
billing — it only executes work. Every request eventually reaches it, flowing
through: API Runtime → Translation Runtime → Speech Runtime → Voice Runtime →
Vision Runtime → Knowledge Runtime → Reasoning Runtime → Embedding Runtime →
Inference Runtime → Streaming Runtime → Workflow Runtime → Storage Runtime →
GPU Runtime → Networking Runtime.

IMPORTANT FOR CURSOR: these runtimes are the EXECUTION layer for products
already built in earlier volumes (Translation Engine in Volume 1, Speech
Cloud in Volume 2, Voice Cloud in Volume 3, Vision/OCR in Volume 4, Knowledge
Cloud in Volume 6, Inference Cloud in Volume 7). Build each runtime as a thin
execution/routing layer that calls into that existing product logic — do not
reimplement translation, speech, voice, or vision business logic from
scratch here. If something doesn't cleanly exist yet to call into, say so
explicitly rather than duplicating it.

Phase 191
Data Plane Foundation
Cursor Master Prompt
You are the Chief Runtime Architect of Lugemi AI.

Build the Lugemi Data Plane.

Mission

Execute every customer request.

Support

Translation

Speech

Voice

Vision

Knowledge

Reasoning

Embeddings

Inference

Streaming

Vector Search

Media Processing

Workflow Execution

Storage

GPU Execution

Architecture

DDD

CQRS

Hexagonal

SOLID

Repository Pattern

Event Driven

Generate

Backend

REST

GraphQL

Realtime APIs

SDK

CLI

Monitoring

Analytics

Terraform

Docker

Kubernetes

Production deployment.

Everything production ready.
