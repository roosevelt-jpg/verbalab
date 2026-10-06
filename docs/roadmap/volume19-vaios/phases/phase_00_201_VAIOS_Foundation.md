<!-- PASTE THIS ENTIRE FILE'S CONTENT BELOW THE LINE INTO CURSOR AGENT AS ONE MESSAGE -->
<!-- ================================================================= -->

VOLUME 19 — VERBALAB AI OPERATING SYSTEM (VAIOS)

Mission: transform VerbaLab from a collection of AI services into a complete
AI-native operating environment that orchestrates AI, knowledge, agents,
workflows, runtime, memory, policies, and intelligence above the cloud
infrastructure layer (not a literal replacement for Linux or Kubernetes).

IMPORTANT FOR CURSOR: this orchestration layer overlaps heavily with two
things already built — Volume 8's AI Kernel (Agent/Workflow/Plugin/Memory/
Policy Runtime) and Volume 10's AI Fabric (the same concerns as cross-cloud
buses). Build VAIOS as the unifying orchestration layer ON TOP OF those
existing systems — calling into AI Kernel's runtimes and AI Fabric's buses —
not as a third, separate reimplementation of scheduling, agent execution, or
memory management. If you find yourself writing new agent-execution or
memory-management logic here, stop and check whether it already exists in
Volume 8 or 10 first.

Phase 201
VAIOS Foundation
Cursor Master Prompt
Build the VerbaLab AI Operating System.

Mission

Create an AI-native operating environment for all VerbaLab services.

This becomes the highest-level orchestration layer.

Products

AI Kernel

Runtime Manager

Scheduler

Memory Manager

Workflow Runtime

Agent Runtime

Reasoning Runtime

Knowledge Runtime

Plugin Runtime

Model Runtime

Context Runtime

Security Runtime

Policy Runtime

Billing Runtime

Telemetry Runtime

Generate

Architecture

Backend

SDK

CLI

REST

GraphQL

Realtime APIs

Monitoring

Analytics

Documentation

Production deployment.

Everything production ready.
