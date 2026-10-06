export type SlackPostMessageInput = {
  channel: string;
  text: string;
  threadTs?: string;
};

export type SlackPostMessageResult = {
  ok: boolean;
  ts?: string;
  error?: string;
};

export interface SlackClient {
  readonly name: string;
  postMessage(input: SlackPostMessageInput): Promise<SlackPostMessageResult>;
}

export class ResendStyleMemorySlackClient implements SlackClient {
  readonly name = 'memory';
  readonly posts: SlackPostMessageInput[] = [];

  async postMessage(input: SlackPostMessageInput): Promise<SlackPostMessageResult> {
    this.posts.push(input);
    return { ok: true, ts: `mem.${this.posts.length}` };
  }
}

export class HttpSlackClient implements SlackClient {
  readonly name = 'slack';

  constructor(
    private readonly botToken: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async postMessage(input: SlackPostMessageInput): Promise<SlackPostMessageResult> {
    if (!this.botToken) {
      return { ok: false, error: 'SLACK_BOT_TOKEN not set' };
    }
    const response = await this.fetchImpl('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.botToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        channel: input.channel,
        text: input.text,
        thread_ts: input.threadTs,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const json = (await response.json.catch( => ({}))) as {
      ok?: boolean;
      ts?: string;
      error?: string;
    };
    if (!response.ok || !json.ok) {
      return { ok: false, error: json.error ?? `HTTP ${response.status}` };
    }
    return { ok: true, ts: json.ts };
  }
}
