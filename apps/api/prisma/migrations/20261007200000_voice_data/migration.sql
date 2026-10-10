-- Native-speaker voice data collection (speakers, prompts, recordings, prompt feedback).
CREATE TABLE "voice_data_speakers" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "language_code" TEXT NOT NULL,
    "dialect" TEXT NOT NULL,
    "gender" TEXT,
    "age_range" TEXT,
    "hometown" TEXT,
    "notes" TEXT,
    "consent_version" TEXT,
    "consent_name" TEXT,
    "consent_at" TIMESTAMP(3),
    "consent_ip" TEXT,
    "consent_user_agent" TEXT,
    "withdrawn_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_data_speakers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "voice_data_speakers_token_key" ON "voice_data_speakers"("token");
CREATE INDEX "voice_data_speakers_dialect_idx" ON "voice_data_speakers"("dialect");

CREATE TABLE "voice_data_prompts" (
    "id" TEXT NOT NULL,
    "dialect" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_data_prompts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "voice_data_prompts_dialect_active_idx" ON "voice_data_prompts"("dialect", "active");

CREATE TABLE "voice_data_recordings" (
    "id" TEXT NOT NULL,
    "speaker_id" TEXT NOT NULL,
    "prompt_id" TEXT,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "mime_type" TEXT NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_key" TEXT,
    "data" BYTEA,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_data_recordings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "voice_data_recordings_speaker_id_created_at_idx" ON "voice_data_recordings"("speaker_id", "created_at");
CREATE INDEX "voice_data_recordings_prompt_id_idx" ON "voice_data_recordings"("prompt_id");
CREATE INDEX "voice_data_recordings_status_idx" ON "voice_data_recordings"("status");

ALTER TABLE "voice_data_recordings" ADD CONSTRAINT "voice_data_recordings_speaker_id_fkey" FOREIGN KEY ("speaker_id") REFERENCES "voice_data_speakers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "voice_data_recordings" ADD CONSTRAINT "voice_data_recordings_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "voice_data_prompts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "voice_data_prompt_feedback" (
    "id" TEXT NOT NULL,
    "speaker_id" TEXT NOT NULL,
    "prompt_id" TEXT NOT NULL,
    "suggestion" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voice_data_prompt_feedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "voice_data_prompt_feedback_speaker_id_prompt_id_key" ON "voice_data_prompt_feedback"("speaker_id", "prompt_id");
CREATE INDEX "voice_data_prompt_feedback_prompt_id_idx" ON "voice_data_prompt_feedback"("prompt_id");

ALTER TABLE "voice_data_prompt_feedback" ADD CONSTRAINT "voice_data_prompt_feedback_speaker_id_fkey" FOREIGN KEY ("speaker_id") REFERENCES "voice_data_speakers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "voice_data_prompt_feedback" ADD CONSTRAINT "voice_data_prompt_feedback_prompt_id_fkey" FOREIGN KEY ("prompt_id") REFERENCES "voice_data_prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
