# Lugemi Language Cloud

**Status:** Volume complete through Production Audit (VL-130–147)  
**Rule:** Parent hub for language capabilities. Do not regenerate M5 modules. Do not claim multi-vendor parity.

---

## Library term → Lugemi

| Library ask | Lugemi reality |
| --- | --- |
| Language Cloud Foundation | **VL-130** — `/language` + product catalog |
| Dialect Detection / Accent Detection | **VL-131–132** — cue scoring (not acoustic ID) |
| Country packs | **VL-135** |
| GraphQL | **VL-136** |
| CQRS / hexagonal | **VL-137** — Language Cloud slice only |
| Terraform / Kubernetes | **VL-138** — optional EKS `af-south-1`; Fly default |
| Language Registry | **VL-139** — curated |
| Translation Engine | **VL-140** |
| Localization Platform | **VL-141** |
| Grammar / Style Intelligence | **VL-142–143** |
| Language Intelligence | **VL-144** |
| Enterprise TM | **VL-145** |
| Language Analytics | **VL-146** |
| Production Audit | **VL-147** — evidence pack in [`language-cloud-audit/`](./language-cloud-audit/) |

---

## Infra

- Fly (default): [`infra/DEPLOY.md`](../infra/DEPLOY.md)
- EKS optional: [`infra/AWS_EKS.md`](../infra/AWS_EKS.md)
- Audit deployment pointer: [`language-cloud-audit/DEPLOYMENT_GUIDE.md`](./language-cloud-audit/DEPLOYMENT_GUIDE.md)

---

## Honesty

Language Cloud is a **bounded enterprise language API hub**. It is **not** Google Translate + DeepL + Microsoft Translator + Amazon Translate + Grammarly + LanguageTool + Crowdin + Phrase combined.

Speech Cloud / speech-intelligence OS ideas from library v2 are scheduled under **VL-150+** (see [`SPEECH_CLOUD.md`](./SPEECH_CLOUD.md) + ADR-0069). This Language Cloud volume does not own those phases.

See ADR-0051–0068.
