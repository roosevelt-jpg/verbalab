/** Shared helpers for LugemiCreative audio upload / record / base64 WAV. */

export function blobFromBase64(audioBase64: string, mimeType = 'audio/wav'): Blob {
  const binary = atob(audioBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

export function formatCredits(n: number): string {
  return n.toLocaleString();
}

export async function recordAudioBlob(maxMs = 60_000): Promise<File> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Microphone recording is not supported in this browser.');
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : undefined;
  const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: BlobPart[] = [];
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      if (recorder.state === 'recording') recorder.stop();
    }, maxMs);
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onerror = () => {
      window.clearTimeout(timer);
      stream.getTracks().forEach((t) => t.stop());
      reject(new Error('Recording failed'));
    };
    recorder.onstop = () => {
      window.clearTimeout(timer);
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      const ext = blob.type.includes('webm') ? 'webm' : 'audio';
      resolve(new File([blob], `recording-${Date.now()}.${ext}`, { type: blob.type }));
    };
    recorder.start();
    // Caller stops via returned promise only on auto-timeout; expose stop by resolving early?
    // For UI we stop after user clicks again — see startRecordingSession.
  });
}

export type RecordingSession = {
  stop: () => Promise<File>;
  cancel: () => void;
};

export function startRecordingSession(): RecordingSession {
  let resolveFile: ((f: File) => void) | null = null;
  let rejectFile: ((e: Error) => void) | null = null;
  const filePromise = new Promise<File>((resolve, reject) => {
    resolveFile = resolve;
    rejectFile = reject;
  });

  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  const chunks: BlobPart[] = [];

  void (async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone recording is not supported in this browser.');
      }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : undefined;
      recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.onstop = () => {
        stream?.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' });
        const ext = blob.type.includes('webm') ? 'webm' : 'audio';
        resolveFile?.(new File([blob], `recording-${Date.now()}.${ext}`, { type: blob.type }));
      };
      recorder.onerror = () => {
        stream?.getTracks().forEach((t) => t.stop());
        rejectFile?.(new Error('Recording failed'));
      };
      recorder.start();
    } catch (err) {
      rejectFile?.(err instanceof Error ? err : new Error('Recording failed'));
    }
  })();

  return {
    stop: async () => {
      if (recorder && recorder.state === 'recording') recorder.stop();
      return filePromise;
    },
    cancel: () => {
      if (recorder && recorder.state === 'recording') recorder.stop();
      stream?.getTracks().forEach((t) => t.stop());
      rejectFile?.(new Error('Recording cancelled'));
    },
  };
}
