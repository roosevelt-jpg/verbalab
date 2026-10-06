import { Query, Resolver } from '@nestjs/graphql';
import { StreamingRuntimeService } from '../streaming-runtime/streaming-runtime.service';
import { GqlStreamingRuntimeEngine } from './gql.types';

@Resolver
export class StreamingRuntimeGraphqlResolver {
  constructor(private readonly streaming: StreamingRuntimeService) {}

  @Query( => GqlStreamingRuntimeEngine, { name: 'streamingRuntimeEngine' })
  streamingRuntimeEngine: GqlStreamingRuntimeEngine {
    const c = this.streaming.engine;
    return {
      product: c.product,
      note: c.note,
      capabilities: c.capabilities,
      websocketOs: c.honesty.websocketOs,
      grpcStreamingOs: c.honesty.grpcStreamingOs,
      videoStreamingOs: c.honesty.videoStreamingOs,
      bidirectionalRealtimeOs: c.honesty.bidirectionalRealtimeOs,
      regeneratesExistingStreams: c.honesty.regeneratesExistingStreams,
      extendsExistingSse: c.honesty.extendsExistingSse,
      sandboxChunkStream: c.honesty.sandboxChunkStream,
      orgWorkspaceScoped: c.honesty.orgWorkspaceScoped,
      primaryTransport: c.honesty.primaryTransport,
      mode: c.mode,
      maxChunksPerStream: c.ceilings.maxChunksPerStream,
    };
  }
}
