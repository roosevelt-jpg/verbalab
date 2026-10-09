# Clerk auth branding (Lugemi)

Clerk is used for **authentication only**. Product onboarding (Creative vs Agents, personalization, persona, plan) lives at `/onboarding` and is Lugemi UI.

## End-to-end flow

1. Marketing CTA (`Sign up` / `Start free`) → `/sign-up`.
2. `/sign-up` or `/sign-in` — Lugemi AuthShell (brand hero + teal/navy card) wrapping Clerk `<SignUp />` / `<SignIn />` (email / Google).
3. On success, Clerk redirects to `/onboarding` (`forceRedirectUrl` / `fallbackRedirectUrl` via `afterClerkAuthPath()`).
4. `/onboarding` multi-step wizard:
   - Platform (LugemiCreative vs LugemiAgents)
   - Personalize
   - Persona
   - Plan (Free / Pro / Business / Enterprise)
5. Destination: `/creative` or `/chat` (Agents). Returning users with `completed` (localStorage or `GET /v1/onboarding`) skip the wizard.
6. Middleware:
   - Unauthenticated product routes → `/sign-in` (onboarding without session → `/sign-up`).
   - Cookie `lugemi_onboarding=pending` → force `/onboarding` until setup finishes (`done`).
7. Product layouts (`/creative`, `/chat`, `/dashboard`) also resume incomplete drafts via `OnboardingResumeGate`.

Local/dev skip: `NEXT_PUBLIC_SKIP_ONBOARDING=1` or `/onboarding?skipOnboarding=1` (also used by `/dev-login`).

Env mirrors (optional, for Clerk dashboard defaults):

- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding`

## Appearance

`apps/web/lib/clerk-appearance.ts` applies Lugemi teal (`#00b8ae` / `#007c78`) and navy (`#10264d`) plus Noto Sans to Clerk widgets. AuthShell owns the Lugemi brand name, headline, and setup-step chrome; Clerk logo/titles are hidden so the first viewport is not a bare auth widget.

Programmatic `useSignUp` / custom email-password forms are not used on production sign-up; `/dev-login` already uses `useSignIn` for ticket/password local review.

## Watermark / “Development mode” badge

| Surface | Removable from Lugemi code? | How to clear |
| --- | --- | --- |
| Clerk **development instance** “Development mode” badge | **No** | Use a **production** Clerk instance (`pk_live_` / `sk_live_`) for public deployments. |
| “Secured by Clerk” / Clerk watermark & logo in component footer | **Not via `appearance` alone on free/dev** | Clerk Dashboard → Customization → Branding. Removing Clerk branding requires a **paid Clerk plan** on a production instance. |
| Lugemi AuthShell / onboarding wizard chrome | Yes | Fully Lugemi-owned CSS. |

Application theming (`appearance`, localization, AuthShell) cannot suppress Clerk’s development watermark. That badge is an instance/plan limitation, not a missing Lugemi prop. Do not claim unpaid Clerk badges were removed from the product. Clerk watermark limits and branded styling boundaries are documented here for engineering reference.

## Bot protection & CAPTCHA settings (Clerk Dashboard)

When users encounter:
> *"The CAPTCHA failed to load. This may be due to an unsupported browser or a browser extension..."*

This occurs when Clerk's embedded bot protection (Cloudflare Turnstile) cannot initialize on the current domain or is blocked by client-side extensions/ad-blockers.

### Fixes & Configuration in Clerk Dashboard

1. **Custom Domain Allowlist (Crucial):**
   - Go to **Clerk Dashboard → Configure → Domains** (or **Settings → Domains**).
   - Ensure `lugemi.com` and `clerk.lugemi.com` are properly verified with green DNS statuses (CNAME records pointed to Clerk).
   - Under **Allowed Origins / Redirect URLs**, ensure `https://lugemi.com`, `https://www.lugemi.com`, and `https://clerk.lugemi.com` are listed.
   - If running locally with live keys, note that live keys will reject bare `127.0.0.1` / `localhost` origins; use `/dev-login` or the HTTPS reverse proxy on `local.lugemi.com`.

2. **Attack Protection / Bot Protection:**
   - In Clerk Dashboard, navigate to **User & Authentication → Attack Protection** (or **Security → Bot Detection**).
   - Clerk supports Turnstile or Google reCAPTCHA. If Turnstile is blocked by certain ISPs or browser shields, you can switch widget behavior or configure threshold settings.
   - If bot protection on sign-up is failing during testing or domain cutover, it can be temporarily set to "Smart" or toggled while DNS propagates.
   - Note: Social signup (e.g. **Continue with Google**) bypasses CAPTCHA challenges because identity verification is delegated to the OAuth provider.

3. **Cloudflare WAF / Bot Management:**
   - If `lugemi.com` is behind Cloudflare in "orange cloud" (proxied) mode, ensure Cloudflare's Bot Fight Mode or WAF Managed Rules do not block scripts loaded from `clerk.lugemi.com` or `challenges.cloudflare.com`.
   - In Cloudflare Dashboard → **Security → WAF**, create an allowlist rule or skip Managed Challenge for paths matching `/_clerk/*` and auth pages.

## Password requirements (Clerk Dashboard)

In the user screenshot:
> *"Your password must contain 15 or more characters."*

Clerk defaults to a minimum password length of 8 characters, but instances configured with high-security policies require 15+ characters.

### How to adjust password length in Clerk Dashboard:

1. Open **Clerk Dashboard → User & Authentication → Email, Phone, Username**.
2. Click on the gear/settings icon next to **Password**.
3. Under **Password requirements**:
   - Set **Minimum length** (e.g., 8 to 12 characters instead of 15).
   - Configure character complexity rules (uppercase, lowercase, numbers, special characters) or have HaveIBeenPwned checks enabled.
4. Click **Save Changes**.
5. *Code experience:* Lugemi's AuthShell displays a proactive tip ("Use 15+ characters for password signup, or choose Continue with Google for instant access") and localized error messages so users are never surprised.
