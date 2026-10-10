<!-- PASTE THIS ENTIRE FILE'S CONTENT BELOW THE LINE INTO CURSOR AGENT AS ONE MESSAGE -->
<!-- ================================================================= -->

VOLUME 10 — AI FABRIC CLOUD

Mission: build the unified AI execution fabric that connects every Lugemi
cloud into a single intelligent platform. This is not another product cloud —
it is the internal communication layer every other cloud sits on top of.

Architecture context (for reference — this is the layering, not a literal
diagram to reproduce):
- Applications call into: Language, Speech, Voice, Vision, Knowledge, Media,
  Enterprise, Developer Cloud, and Foundation Models.
- Those all communicate through AI FABRIC, which provides 16 internal buses:
  Event, Workflow, Context, Identity, Knowledge, Prompt, Reasoning, Inference,
  Telemetry, Billing, Policy, Plugin, Memory, Security, Agent, Streaming.
- AI Fabric itself runs on top of AI Kernel (Volume 8), Inference Cloud
  (Volume 7), and the GPU Cluster (Volume 7).

Phase 106
AI Fabric Foundation
Cursor Master Prompt
You are the Chief Platform Architect of Lugemi AI.

Build AI Fabric.

Mission

Create the internal operating fabric connecting every Lugemi Cloud.

AI Fabric must become the central communication layer.

Support

Service Discovery

Context Propagation

Distributed Messaging

Workflow Routing

AI Routing

Prompt Routing

Knowledge Routing

Policy Routing

Identity Propagation

Observability

Telemetry

Generate

Backend

Fabric APIs

SDK

CLI

Dashboard

Monitoring

Analytics

Terraform

Docker

Kubernetes

Documentation

Production deployment.
