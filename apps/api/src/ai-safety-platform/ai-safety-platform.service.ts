import { BadRequestException, Injectable } from '@nestjs/common';
import { PolicyRuntimeService } from '../policy-runtime/policy-runtime.service';
import {
  aiSafetyDetectionsCatalog,
  aiSafetyPlatformEngineCatalog,
} from './ai-safety-platform.catalog';

@Injectable
export class AiSafetyPlatformService {
  constructor(private readonly policyRuntime: PolicyRuntimeService) {}

  engine {
    const catalog = aiSafetyPlatformEngineCatalog;
    const policyEngine = this.policyRuntime.engine;
    return {
      ...catalog,
      policyRuntime: {
        product: policyEngine.product,
        honesty: policyEngine.honesty,
        surface: 'GET /v1/policy-runtime/engine',
        evaluateSurface: 'POST /v1/policy-runtime/evaluate',
        fabricSurface: 'GET /v1/policy-fabric/products',
      },
      policyRuntimeIntegrated: true,
    };
  }

  detections(query?: string) {
    const catalog = this.engine;
    const q = (query ?? '').trim.toLowerCase;
    const detections = catalog.detections.filter((d) => {
      if (!q) return true;
      return (
        d.id.toLowerCase.includes(q) ||
        d.kind.toLowerCase.includes(q) ||
        d.name.toLowerCase.includes(q) ||
        d.notes.toLowerCase.includes(q)
      );
    });
    return {
      detections,
      count: detections.length,
      blockedDetections: catalog.blockedDetections,
      honesty: catalog.honesty,
      safety: catalog.safety,
      policyRuntimeIntegrated: true,
      note: catalog.note,
      docs: catalog.docs,
    };
  }

  /** Safety check — consults Policy Runtime engine posture + detection block catalog. */
  check(detectionId?: string) {
    const detections = aiSafetyDetectionsCatalog;
    const detection = detectionId
      ? detections.find((d) => d.id === detectionId)
      : detections[0];
    if (!detection) {
      throw new BadRequestException(`Unknown safety detection: ${detectionId}`);
    }
    const policyEngine = this.policyRuntime.engine;
    const blocked = detection.blockPosture === 'block';
    return {
      detection,
      allowed: !blocked,
      blocked,
      blockPosture: detection.blockPosture,
      policyRuntimeIntegrated: true,
      policySurface: 'GET /v1/policy-runtime/engine',
      policyEvaluateSurface: 'POST /v1/policy-runtime/evaluate',
      policyFabricSurface: 'GET /v1/policy-fabric/products',
      policyRuntime: {
        product: policyEngine.product,
        honesty: policyEngine.honesty,
        hardGate: policyEngine.honesty?.hardGate ?? true,
      },
      reason: blocked
        ? `Blocked by AI Safety (${detection.kind}) with Policy Runtime integrated posture.`
        : `Allowed with safety posture=${detection.blockPosture}.`,
      honesty: aiSafetyPlatformEngineCatalog.honesty,
      docs: '/docs/AI_SAFETY_PLATFORM.md',
    };
  }

  /** Evaluate action against safety catalog + Policy Runtime surface references. */
  evaluate(input: { action?: string; detectionId?: string }) {
    const action = (input.action ?? '').trim;
    const detections = aiSafetyDetectionsCatalog;
    const byAction = action
      ? detections.find((d) => d.policyAction === action || d.kind === action)
      : undefined;
    const detection = input.detectionId
      ? detections.find((d) => d.id === input.detectionId)
      : byAction;
    if (!detection && !action) {
      throw new BadRequestException('detectionId or action is required');
    }
    if (!detection) {
      const policyEngine = this.policyRuntime.engine;
      return {
        allowed: true,
        blocked: false,
        action,
        policyRuntimeIntegrated: true,
        policySurface: 'POST /v1/policy-runtime/evaluate',
        policyRuntime: { product: policyEngine.product, honesty: policyEngine.honesty },
        reason: 'No matching safety detection — defer to Policy Runtime evaluate for org denies.',
        docs: '/docs/AI_SAFETY_PLATFORM.md',
      };
    }
    return this.check(detection.id);
  }

  query(query?: string) {
    return this.detections(query);
  }

  monitoring {
    const catalog = this.engine;
    return {
      mode: 'safety',
      detectionCount: catalog.detections.length,
      blockedCount: catalog.blockedDetections.length,
      policyRuntimeIntegrated: true,
      honesty: catalog.honesty,
      safety: catalog.safety,
      note: 'AI Safety Platform monitoring snapshot — Policy Runtime integrated.',
    };
  }
}
