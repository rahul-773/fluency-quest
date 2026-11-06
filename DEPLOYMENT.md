# Production deployment

FluencyQuest is a Vite static web app using Supabase Auth and Postgres for accounts and cloud saves. There is no application server to host. The quiz arena is currently solo practice against simulated opponents; it is not online matchmaking.

## 1. Create the Supabase project

1. Create a Supabase project and keep its database password private.
2. Apply [`supabase/migrations/20261104130000_player_progress.sql`](./supabase/migrations/20261104130000_player_progress.sql) using the Supabase SQL editor or Supabase CLI.
3. In **Authentication → URL Configuration**, set the production site URL and add the production URL plus local development URLs to the redirect allow list.
4. Configure email confirmation, SMTP, password policy, and rate limits for the audience and traffic you expect. Do not rely on Supabase's development email delivery for a public launch.
5. Copy the project URL and publishable/anon key into the hosting provider's build environment as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
6. Deploy the self-service account deletion function from the project directory with `supabase functions deploy delete-account --project-ref <your-project-ref>`. It uses Supabase's server-side `SUPABASE_SERVICE_ROLE_KEY`; never copy that key into frontend environment variables.

The publishable/anon key is intended for browser use and is protected by the row-level security policies in the migration. Never put a Supabase service-role/secret key in a `VITE_*` variable or browser bundle.

## 2. Build and deploy the frontend

Deploy the `project` directory as a static Vite site on Vercel, Netlify, Cloudflare Pages, or another static host:

- Build command: `npm run build`
- Output directory: `dist`
- Node.js build runtime: 22 or newer
- Environment variables: the two Supabase variables above

Configure SPA fallback/rewrite to serve `index.html` for app routes. Add the final HTTPS domain to Supabase's allowed redirect URLs. Preview/deployment environments need their own allowed redirect URLs if account email links should return to previews.

## 3. Verify before launch

- Test signup, confirmation email, sign-in, sign-out, password reset, password update, and account deletion on the final domain.
- Verify two separate accounts cannot read or change each other's `player_progress` rows.
- Test guest progress migration on first sign-in, sign-in on another device, and account switching.
- Verify microphone permissions and voice calls on HTTPS from the target browsers/networks. Peer practice currently relies on the default PeerJS signaling service and a public STUN server; provide a managed/self-hosted signaling service and TURN relay before promising reliable calls worldwide.
- Publish a privacy notice and support contact that accurately describe email/account data, progress storage, retention, and deletion. Establish database backups/restore procedures and monitor auth/database quotas before inviting real users.

## Current product boundaries

Cloud progress is account-owned, but XP, gems, quiz scores, and voice scores are still client-reported. The quiz opponents are simulated. Do not use these values for prizes, public rankings, or other adversarial use until game outcomes are validated by a trusted server and real matchmaking is implemented. The account deletion function must be deployed before enabling signup for real users.
