/** Native-reviewed prompt templates (pilot corridor). Content is source-controlled; native review status is tracked in catalog. */

export function disclosurePrompt(variety: string | null, recordingEnabled: boolean): string {
  const lang = variety?.startsWith('sw') ? 'sw' : 'en';
  if (lang === 'sw') {
    return recordingEnabled
      ? 'Karibu kwa AccessLine. Hii ni huduma ya AI ya biashara. Simu inaweza kurekodiwa kwa ubora wa huduma. Bonyeza 1 kwa Kiswahili, 2 kwa English, au 0 kwa mwakilishi.'
      : 'Karibu kwa AccessLine. Hii ni huduma ya AI ya biashara. Bonyeza 1 kwa Kiswahili, 2 kwa English, au 0 kwa mwakilishi.';
  }
  return recordingEnabled
    ? 'Welcome to AccessLine. This is an AI-assisted business service. This call may be recorded for quality. Press 1 for Kiswahili, 2 for English, or 0 for a human agent.'
    : 'Welcome to AccessLine. This is an AI-assisted business service. Press 1 for Kiswahili, 2 for English, or 0 for a human agent.';
}

export function askIntentPrompt(variety: string | null): string {
  return variety?.startsWith('sw')
    ? 'Unaweza kuuliza hali ya delivery, saa za kufungua, kurudia, kubadilisha lugha, au kuzungumza na mwakilishi.'
    : 'You can ask about delivery status, opening hours, repeat, switch language, or speak with a human agent.';
}

export function authPrompt(variety: string | null): string {
  return variety?.startsWith('sw')
    ? 'Kabla ya taarifa za oda, thibitisha utambulisho. Ingiza msimbo wa OTP uliotumwa kwa namba iliyosajiliwa, kisha bonyeza #.'
    : 'Before private order details, verify your identity. Enter the OTP sent to your registered number, then press #.';
}

export function askReferencePrompt(variety: string | null): string {
  return variety?.startsWith('sw')
    ? 'Tafadhali sema au bonyeza namba ya oda yako, pamoja na sufuri za mwanzo. Tutaisoma tena ili uthibitishe.'
    : 'Please say or key in your order reference, including leading zeros. We will read it back for confirmation.';
}

export function statusPrompt(
  variety: string | null,
  status: string,
  freshness: string,
  updatedAt: string | null,
  eta: string | null,
): string {
  const sw = variety?.startsWith('sw');
  const statusPhrase: Record<string, { en: string; sw: string }> = {
    dispatched: { en: 'dispatched', sw: 'imetumwa' },
    out_for_delivery: { en: 'out for delivery', sw: 'iko njiani kwa delivery' },
    delivered: { en: 'delivered', sw: 'imefikishwa' },
    unknown: { en: 'unknown in the logistics system', sw: 'haijulikani katika mfumo wa logistics' },
    not_found: { en: 'not found for your authenticated account', sw: 'haikupatikana kwa akaunti yako' },
  };
  const phrase = statusPhrase[status] ?? statusPhrase.unknown!;
  const when = updatedAt ? (sw ? ` Ilisasishwa ${updatedAt}.` : ` Last updated ${updatedAt}.`) : '';
  const fresh =
    freshness === 'stale'
      ? sw
        ? ' Taarifa inaweza kuwa ya zamani.'
        : ' This result may be stale.'
      : '';
  const etaLine =
    eta == null
      ? sw
        ? ' Hakuna ETA iliyothibitishwa.'
        : ' No confirmed ETA is available.'
      : sw
        ? ` ETA iliyotolewa: ${eta}.`
        : ` Provided ETA: ${eta}.`;
  return sw
    ? `Hali ya oda yako: ${phrase.sw}.${when}${fresh}${etaLine}`
    : `Your order status is ${phrase.en}.${when}${fresh}${etaLine}`;
}

export function handoffPrompt(variety: string | null, available: boolean): string {
  if (!available) {
    return variety?.startsWith('sw')
      ? 'Hakuna mwakilishi kwa sasa. Tunaweza kufungua kesi na kukupa namba ya kumbukumbu. Hakuna ahadi ya callback isipokuwa imewekwa.'
      : 'No staff are available right now. We can open a case and give you a reference. No callback is promised unless configured.';
  }
  return variety?.startsWith('sw')
    ? 'Tunakuunganisha na mwakilishi aliyeidhinishwa.'
    : 'Connecting you to an allowlisted staff destination.';
}
