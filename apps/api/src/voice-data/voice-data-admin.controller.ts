import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { PlatformAdminGuard } from '../common/guards/platform-admin.guard';
import { CreateSpeakerInput, VoiceDataService } from './voice-data.service';

@Controller('v1/admin/voice-data')
@UseGuards(PlatformAdminGuard)
export class VoiceDataAdminController {
  constructor(private readonly voiceData: VoiceDataService) {}

  @Get('dialects')
  dialects() {
    return this.voiceData.dialects();
  }

  @Get('overview')
  overview() {
    return this.voiceData.overview();
  }

  @Get('speakers')
  speakers(@Query('dialect') dialect?: string) {
    return this.voiceData.listSpeakers(dialect?.trim() || undefined);
  }

  @Post('speakers')
  createSpeaker(@Body() body: CreateSpeakerInput) {
    return this.voiceData.createSpeaker(body);
  }

  @Delete('speakers/:id')
  deleteSpeaker(@Param('id') id: string) {
    return this.voiceData.deleteSpeaker(id);
  }

  @Get('prompts')
  prompts(@Query('dialect') dialect: string) {
    return this.voiceData.listPrompts(dialect ?? '');
  }

  @Post('prompts')
  addPrompts(@Body() body: { dialect?: unknown; category?: unknown; lines?: unknown }) {
    return this.voiceData.addPrompts(body);
  }

  @Patch('prompts/:id')
  updatePrompt(@Param('id') id: string, @Body() body: { active?: unknown }) {
    return this.voiceData.setPromptActive(id, body.active);
  }

  @Get('recordings')
  recordings(
    @Query('speakerId') speakerId?: string,
    @Query('dialect') dialect?: string,
    @Query('status') status?: string,
  ) {
    return this.voiceData.listRecordings({ speakerId, dialect, status });
  }

  @Get('recordings/:id/audio')
  async audio(@Param('id') id: string, @Res() res: Response) {
    const { data, mimeType } = await this.voiceData.recordingAudio(id);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(data);
  }

  @Patch('recordings/:id')
  updateRecording(@Param('id') id: string, @Body() body: { status?: unknown }) {
    return this.voiceData.setRecordingStatus(id, body.status);
  }

  @Get('feedback')
  feedback(@Query('dialect') dialect: string) {
    return this.voiceData.listFeedback(dialect ?? '');
  }

  @Get('export')
  async export(@Query('dialect') dialect: string, @Res() res: Response) {
    const jsonl = await this.voiceData.exportManifest(dialect ?? '');
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="lugemi-voice-data-${dialect}.jsonl"`);
    res.send(jsonl);
  }
}
