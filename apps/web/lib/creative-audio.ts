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

export type RecordingSession = {
  stop: () => Promise<File>;
  cancel: () => void;
};

export function startRecordingSession(): RecordingSession {
  const resolveRef: { current: ((f: File) => void) | null } = { current: null };
  const rejectRef: { current: ((e: Error) => void) | null } = { current: null };
  const filePromise = new Promise<File>((resolve, reject) => {
    resolveRef.current = resolve;
    rejectRef.current = reject;
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
        resolveRef.current?.(new File([blob], `recording-${Date.now()}.${ext}`, { type: blob.type }));
      };
      recorder.onerror = () => {
        stream?.getTracks().forEach((t) => t.stop());
        rejectRef.current?.(new Error('Recording failed'));
      };
      recorder.start();
    } catch (err) {
      rejectRef.current?.(err instanceof Error ? err : new Error('Recording failed'));
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
      rejectRef.current?.(new Error('Recording cancelled'));
    },
  };
}
