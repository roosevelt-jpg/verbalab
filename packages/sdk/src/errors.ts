export class LugemiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'LugemiError';
  }

  get isConflict(): boolean {
    return this.status === 409 || this.code === 'conflict';
  }

  get isFeatureDisabled(): boolean {
    return this.status === 403 || this.code === 'feature_disabled';
  }

  get isAuthError(): boolean {
    return (
      this.status === 401 ||
      this.status === 503 ||
      this.code === 'auth_not_configured' ||
      this.code === 'actor_required'
    );
  }
}
