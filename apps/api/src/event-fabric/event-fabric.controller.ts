import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventFabricService } from './event-fabric.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { CloudEvent } from './event-fabric.bus';

@Controller('v1/event-fabric')
export class EventFabricController {
  constructor(private readonly fabric: EventFabricService) {}

  @Get('products')
  products {
    return this.fabric.products;
  }

  @Get('engine')
  engine {
    return this.fabric.products;
  }

  @Get('brokers')
  brokers {
    return this.fabric.brokers;
  }

  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  publish(
    @Body
    body: {
      topic?: string;
      type?: string;
      source?: string;
      data?: unknown;
      eventVersion?: string;
      dataschema?: string | null;
      subject?: string | null;
    },
  ) {
    return this.fabric.publish({
      topic: body.topic ?? 'default',
      type: body.type ?? 'com.lugemi.event',
      source: body.source,
      data: body.data,
      eventVersion: body.eventVersion,
      dataschema: body.dataschema,
      subject: body.subject,
    });
  }

  @Get('events')
  poll(
    @Query('topic') topic?: string,
    @Query('count') count?: string,
    @Query('eventVersion') eventVersion?: string,
  ) {
    return this.fabric.poll({
      topic: topic ?? 'default',
      count: count ? Number(count) : undefined,
      eventVersion,
    });
  }

  @Post('events/:streamId/fail')
  @HttpCode(HttpStatus.OK)
  fail(
    @Param('streamId') streamId: string,
    @Body
    body: {
      topic?: string;
      reason?: string;
      maxAttempts?: number;
      event?: Partial<CloudEvent>;
    },
  ) {
    return this.fabric.fail({
      topic: body.topic ?? 'default',
      streamId,
      reason: body.reason,
      maxAttempts: body.maxAttempts,
      event: body.event,
    });
  }

  @Get('dlq')
  dlq(@Query('topic') topic?: string) {
    return this.fabric.dlq(topic ?? 'default');
  }

  @Post('dlq/retry')
  @HttpCode(HttpStatus.OK)
  retryDlq(@Body body: { topic?: string; streamId: string }) {
    return this.fabric.retryDlq({
      topic: body.topic ?? 'default',
      streamId: body.streamId,
    });
  }

  @Post('replay')
  @HttpCode(HttpStatus.OK)
  replay(
    @Body
    body: { topic?: string; afterId?: string; count?: number },
  ) {
    return this.fabric.replay({
      topic: body.topic ?? 'default',
      afterId: body.afterId,
      count: body.count,
    });
  }

  @Get('snapshots')
  snapshots {
    return this.fabric.snapshots;
  }

  @Get('analytics')
  analytics {
    return this.fabric.analytics;
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession session: SessionContext) {
    return this.fabric.overview(session);
  }

  @Get('monitoring')
  monitoring {
    return this.fabric.monitoring;
  }
}
