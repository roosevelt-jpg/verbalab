import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiException } from '../common/errors/api-exception';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { TranslateAuthContext, TranslateAuthGuard } from '../common/guards/translate-auth.guard';
import { NativeSpeechEngineService } from './nse.service';
import type { NseProsodySettings } from './nse.types';

type AuthedRequest = Request & {
  translateAuth?: TranslateAuthContext;
  sessionAuth?: SessionContext;
};

@Controller('v1/speech')
export class NativeSpeechEngineController {
  constructor(private readonly engine: NativeSpeechEngineService) {}

  @Get('capabilities')
  @Header('Cache-Control', 'public, max-age=60')
  capabilities() {
    return this.engine.capabilities();
  }

  @Get('evaluation')
  @Header('Cache-Control', 'public, max-age=60')
  evaluation() {
    return this.engine.evaluationPlan();
  }

  @Post('diagnose')
  @HttpCode(HttpStatus.OK)
  diagnose(
    @Body()
    body: {
      audioBase64?: string;
      mimeType?: string;
      synthEngine?: string;
      verificationStatus?: string;
      requireIntelligible?: boolean;
    },
  ) {
    if (!body.audioBase64) {
      throw new ApiException('validation_error', 'audioBase64 is required', HttpStatus.BAD_REQUEST);
    }
    return this.engine.diagnose({
      audioBase64: body.audioBase64,
      mimeType: body.mimeType,
      synthEngine: body.synthEngine,
      verificationStatus: body.verificationStatus,
      requireIntelligible: body.requireIntelligible,
    });
  }

  @Post('recognitions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  recognize(
    @Body()
    body: {
      audioBase64?: string;
      mimeType?: string;
      language?: string;
      text?: string;
      askIfUncertain?: boolean;
    },
  ) {
    if (body.text?.trim() && !body.audioBase64) {
      return this.engine.detectSourceVariety({
        text: body.text,
        askIfUncertain: body.askIfUncertain,
      });
    }
    if (!body.audioBase64) {
      throw new ApiException(
        'validation_error',
        'audioBase64 or text is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.engine.speechToText({
      audioBase64: body.audioBase64,
      mimeType: body.mimeType,
      language: body.language,
      askIfUncertain: body.askIfUncertain,
    });
  }

  @Post('syntheses')
  @HttpCode(HttpStatus.OK)
  async synthesize(
    @Req() req: AuthedRequest,
    @Res() res: Response,
    @Body()
    body: {
      text?: string;
      language?: string;
      voice?: string;
      format?: 'mp3' | 'wav';
      prosody?: NseProsodySettings;
      requireIntelligible?: boolean;
      demoRemap?: boolean;
      passportDictionary?: boolean;
      asJson?: boolean;
    },
  ) {
    // Optional auth — public demos work; Clerk/API key enables passport lexemes.
    let actor: { organizationId?: string; workspaceId?: string; userId?: string } | undefined;
    try {
      if (req.headers.authorization) {
        // Lazy: if TranslateAuth already ran via optional path — use it when present
        if (req.translateAuth) {
          actor = {
            organizationId: req.translateAuth.organizationId,
            workspaceId: req.translateAuth.workspaceId,
            userId: req.sessionAuth?.userId,
          };
        }
      }
    } catch {
      /* public */
    }

    const result = await this.engine.synthesize(
      {
        text: body.text ?? '',
        language: body.language ?? '',
        voice: body.voice,
        format: body.format,
        prosody: body.prosody,
        requireIntelligible: body.requireIntelligible,
        demoRemap: body.demoRemap,
        passportDictionary: body.passportDictionary,
      },
      actor,
    );

    if (body.asJson) {
      const { _audio, _headers, ...json } = result;
      res.status(HttpStatus.OK).json(json);
      return;
    }

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Lugemi-Voice', result._headers.voice);
    res.setHeader('X-Lugemi-Provider', result._headers.provider);
    res.setHeader('X-Lugemi-Engine', 'native_speech_engine');
    res.setHeader('X-Lugemi-Job-Id', result.jobId);
    if (result._headers.synthEngine) {
      res.setHeader('X-Lugemi-Synth-Engine', result._headers.synthEngine);
    }
    if (result._headers.verificationStatus) {
      res.setHeader('X-Lugemi-Verification-Status', result._headers.verificationStatus);
    }
    res.setHeader('X-Lugemi-Synthetic-Speech', 'true');
    res.setHeader('X-Lugemi-Capability-Status', result.capabilityStatus);
    if (result._headers.remapped) {
      res.setHeader('X-Lugemi-Demo-Remapped', 'true');
      if (result._headers.requestedVoice) {
        res.setHeader('X-Lugemi-Requested-Voice', result._headers.requestedVoice);
      }
      res.setHeader('X-Lugemi-Requested-Language', result._headers.requestedLanguage);
      if (result._headers.remapNote) {
        res.setHeader('X-Lugemi-Demo-Note', result._headers.remapNote.slice(0, 200));
      }
    }
    res.status(HttpStatus.OK).send(result._audio);
  }

  @Post('speech-translations')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  async speechTranslate(
    @Req() req: AuthedRequest,
    @Body()
    body: {
      audioBase64?: string;
      text?: string;
      sourceLanguage?: string;
      targetLanguage?: string;
      targetVoice?: string;
      prosody?: NseProsodySettings;
      asJson?: boolean;
    },
  ) {
    if (!body.targetLanguage) {
      throw new ApiException('validation_error', 'targetLanguage is required', HttpStatus.BAD_REQUEST);
    }
    const result = await this.engine.speechTranslate(
      {
        audioBase64: body.audioBase64,
        text: body.text,
        sourceLanguage: body.sourceLanguage,
        targetLanguage: body.targetLanguage,
        targetVoice: body.targetVoice,
        prosody: body.prosody,
      },
      {
        organizationId: req.translateAuth!.organizationId,
        workspaceId: req.translateAuth!.workspaceId,
        userId: req.sessionAuth?.userId,
      },
    );
    const { _audio, _headers, ...json } = result as typeof result & {
      _audio?: Buffer;
      _headers?: unknown;
    };
    return json;
  }

  @Post('translations')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TranslateAuthGuard)
  async textTranslate(
    @Body() body: { text?: string; source?: string; target?: string },
  ) {
    if (!body.text?.trim() || !body.target?.trim()) {
      throw new ApiException(
        'validation_error',
        'text and target are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.engine.textTranslate({
      text: body.text,
      source: body.source,
      target: body.target,
    });
  }
}
