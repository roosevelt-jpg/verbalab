type LogFields = Record<string, unknown>;

function emit(level: string, message: string, fields?: LogFields) {
  const line = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    service: 'lugemi-api',
    ...(fields ?? {}),
  };
  const payload = JSON.stringify(line);
  if (level === 'error') {
    console.error(payload);
  } else if (level === 'warn') {
    console.warn(payload);
  } else {
    console.log(payload);
  }
}

/** Minimal structured JSON logger (no Prometheus). */
export const structuredLog = {
  info(message: string, fields?: LogFields) {
    emit('info', message, fields);
  },
  warn(message: string, fields?: LogFields) {
    emit('warn', message, fields);
  },
  error(message: string, fields?: LogFields) {
    emit('error', message, fields);
  },
};
