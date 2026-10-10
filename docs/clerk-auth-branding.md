# Clerk auth branding (Lugemi)

Clerk is used for **authentication only**. Product onboarding (Creative vs Agents, personalization, persona, plan) lives at `/onboarding` and is Lugemi UI.

## End-to-end flow

1. Marketing CTA (`Sign up` / `Start free`) → `/sign-up`.
2. `/sign-up` or `/sign-in` — Lugemi AuthShell (brand hero + teal/navy card) wrapping Lugemi-native forms powered by Clerk custom flows (`useSignIn`, `useSignUp`, `authenticateWithRedirect`). No Clerk prebuilt chrome or "Secured by clerk" watermarks.
3. On success, Clerk redirects to `/onboarding` (or `/admin` if platform admin).
4. `/onboarding` multi-step wizard:
   - Platform (LugemiCreative vs LugemiAgents)
   - Personalize
   - Persona
   - Plan (Free / Pro / Business / Enterprise)
5. Destination: `/creative` or `/chat` (Agents). Returning users with `completed` (localStorage or `GET /v1/onboarding`) skip the wizard.
6. Middleware:
   - Unauthenticated product routes → `/sign-in` (onboarding without session → `/sign-up`).
   - Cookie `lugemi_onboarding=pending` → force `/onboarding` until setup finishes (`done`).
   - Routes under `/admin*` never force onboarding.
   - Platform admins (identified via `lugemi_platform_admin=1` cookie or `GET /v1/admin/status` with `ADMIN_EMAILS`) bypass user onboarding and are redirected immediately to `/admin` instead of the Creative/Agents plan wizard.
7. Product layouts (`/creative`, `/chat`, `/dashboard`) also resume incomplete drafts via `OnboardingResumeGate` (while letting platform admins through without forced onboarding).

Local/dev skip: `NEXT_PUBLIC_SKIP_ONBOARDING=1` or `/onboarding?skipOnboarding=1` (also used by `/dev-login`).

Env mirrors (optional, for Clerk dashboard defaults):

- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding`

## Appearance

AuthShell owns the Lugemi brand name, headline, setup-step chrome, and form cards. Forms are custom Lugemi React components using Clerk's `useSignIn` and `useSignUp` flows, running Clerk behind Lugemi's UI without prebuilt cards or Clerk footer watermarks.

`apps/web/lib/clerk-appearance.ts` retains appearance configuration for any auxiliary Clerk components.

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

This is **Clerk bot protection** (Cloudflare Turnstile), not a Lugemi bug. It often appears on the purple Clerk **Account Portal** at `https://accounts.lugemi.com/sign-up` — that is Clerk-hosted UI, not Lugemi’s branded `/sign-up`.

### Prefer the Lugemi app signup

Always sign up at **`https://lugemi.com/sign-up`** (teal Lugemi AuthShell). Google OAuth from there returns to `/sso-callback` → `/onboarding` and does not need the Account Portal form.

In **Clerk Dashboard → Account Portal** (or **Customization → Account Portal**):
- Set the application home URL to `https://lugemi.com`
- Point Sign-in / Sign-up paths to `https://lugemi.com/sign-in` and `https://lugemi.com/sign-up` so users are not sent to `accounts.lugemi.com`

### Fixes in Clerk Dashboard

1. **Domains**
   - **Configure → Domains**: `lugemi.com`, `clerk.lugemi.com`, and `accounts.lugemi.com` verified.
   - Allowed origins / redirect URLs include `https://lugemi.com`, `https://www.lugemi.com`, `https://clerk.lugemi.com`, `https://accounts.lugemi.com`.

2. **Attack Protection / Bot sign-up protection**
   - **User & Authentication → Attack Protection** (or **Security → Bot Detection**).
   - If CAPTCHA fails on `accounts.lugemi.com` or behind privacy extensions, temporarily **disable Bot sign-up protection** (or set to a less aggressive mode) until domains are stable.
   - **Continue with Google** normally skips password CAPTCHA once OAuth starts; the error on Account Portal usually blocks the page *before* Google runs.

3. **Browser / extensions**
   - Ad blockers, Privacy Badger, uBlock, and “strict” tracking protection often block `challenges.cloudflare.com`. Try a clean window or disable those extensions on `lugemi.com` / `accounts.lugemi.com`.

4. **Cloudflare WAF (apex)**
   - If `lugemi.com` is orange-clouded, do not challenge scripts from `clerk.lugemi.com`, `accounts.lugemi.com`, or `challenges.cloudflare.com`.
   - Lugemi’s CSP allows Turnstile (`challenges.cloudflare.com`) on the app origin; Account Portal CSP is owned by Clerk.

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

## Social Connections — Google OAuth (`Missing required parameter: client_id` Error 400)

When users click **Continue with Google** and see:
> *"Access blocked: Authorization Error — Missing required parameter: client_id — Error 400: invalid_request"*

This occurs when Clerk has Google social sign-in enabled in the instance, but the **Google Cloud OAuth Client ID** and **Client Secret** have not yet been provided in the Clerk Dashboard (or Clerk's shared development credentials cannot be used on a custom domain / production instance `pk_live_*`).

### How to configure Google OAuth in Google Cloud Console & Clerk Dashboard

#### Step 1: Create OAuth Credentials in Google Cloud Console
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/).
2. Select your Lugemi project (or create `lugemi-production`).
3. Go to **APIs & Services → OAuth consent screen**:
   - User Type: **External**.
   - App Name: `Lugemi`.
   - User support email & developer contact email: `admin@lugemi.com` (or your domain admin).
   - App domain URLs:
     - Application home page: `https://lugemi.com`
     - Application privacy policy link: `https://lugemi.com/privacy`
     - Application terms of service link: `https://lugemi.com/terms`
     - Authorized domains: `lugemi.com`, `clerk.lugemi.com`.
   - Scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`.
   - Publish the app (or leave in testing if only testing with specific accounts).
4. Go to **APIs & Services → Credentials**:
   - Click **+ CREATE CREDENTIALS → OAuth client ID**.
   - Application type: **Web application**.
   - Name: `Lugemi Clerk Auth`.
   - **Authorized JavaScript origins**:
     - `https://lugemi.com`
     - `https://clerk.lugemi.com`
   - **Authorized redirect URIs** (get this exact URI from Clerk Dashboard in Step 2, e.g.):
     - `https://clerk.lugemi.com/v1/oauth_callback`
   - Click **Create**.
   - Copy the generated **Client ID** and **Client Secret**.

#### Step 2: Configure in Clerk Dashboard
1. Open [Clerk Dashboard](https://dashboard.clerk.com/) and select your application.
2. In the navigation sidebar, go to **User & Authentication → Social Connections**.
3. Locate **Google** and click the gear/settings icon.
4. Toggle **Enable for sign-up and sign-in** ON.
5. Under **Configuration**:
   - Select **Use custom credentials** (required for production domains like `lugemi.com`).
   - Paste the **Client ID** from Google Cloud Console.
   - Paste the **Client Secret** from Google Cloud Console.
   - Verify the **Authorized redirect URI** matches what was entered in Google Cloud Console.
6. Click **Save Changes**.

#### Step 3: Enable the Google button in Lugemi Web
Production Fly deploys bake `NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED=true` into the web image (Dockerfile build-arg + `infra/fly/web.jnb.toml`). After Steps 1–2, redeploy web so `/sign-up` and `/sign-in` show **Continue with Google**.

To temporarily hide the button (e.g. while rotating GCP credentials):
```bash
NEXT_PUBLIC_CLERK_GOOGLE_OAUTH_ENABLED=false
```
When set to `false`, `AuthShell` and `SignUp`/`SignIn` hide the Google button and divider so users only see email/password.
