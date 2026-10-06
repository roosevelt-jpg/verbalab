export type SendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
};

export type SendEmailResult = {
  id: string;
  provider: string;
};

export interface EmailProvider {
  readonly name: string;
  send(input: SendEmailInput): Promise<SendEmailResult>;
}
