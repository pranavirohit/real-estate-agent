# Deployment checklist

## Before deploying TEE server

- [ ] `MNEMONIC` set in Eigen dashboard secrets (or your host’s secret store).
- [ ] `PORT` configured if not using default **8080**.
- [ ] `CORS_ORIGINS` includes your Next.js origin (production domain).
- [ ] Docker build succeeds locally (if you deploy via container).

## After deploying TEE server

- [ ] Run: `curl https://YOUR-TEE-URL/health`
- [ ] Expect a healthy JSON response (e.g. `status: ok` or equivalent from `src/index.ts`).
- [ ] Optional: set `EXPOSE_SIGNER_ADDRESS=true` on the TEE host only when debugging; response may include `signer` (TEE wallet address). Compare with **Derived Addresses** on [Eigen Sepolia verifiability](https://verify-sepolia.eigencloud.xyz) for your app ID when validating a deployment.
- [ ] Check Eigen (or host) logs for startup errors.
- [ ] Record the public TEE base URL for Next.js `TEE_ENDPOINT`.

### EigenCloud dashboard and live demo checks

- Open `https://verify-sepolia.eigencloud.xyz/app/<YOUR_APP_ID>` in a browser (JavaScript enabled). Confirm **Release / build** details load, not infinite loading states (stale or stopped deployments may fail here).
- If the compute app was scaled down or replaced, use Eigen operator tooling (`ecloud compute app upgrade` for an existing app ID; avoid creating duplicate deployments unintentionally) so the running digest matches the repo you present.
- After deploying Next.js, call **`GET /api/health`** on your site: `tee.ok` should be **`true`** when the browser-facing app can reach `TEE_ENDPOINT`.

## Before deploying Next.js

- [ ] `TEE_ENDPOINT` set in Vercel (or your platform) to the deployed TEE **https** URL.
- [ ] `NEXTAUTH_URL` matches the deployed site URL.
- [ ] `NEXTAUTH_SECRET` set to a strong random value.
- [ ] Confirm the deployment environment can reach `TEE_ENDPOINT` (no private-only URL unless the app runs in the same network).

## After deploying Next.js

- [ ] Visit `/api/health` — `tee.ok` should be true when the TEE is reachable.
- [ ] Run through verification end-to-end (ID + selfie).
- [ ] Check browser console for client errors; check platform logs for API route errors.

## Reference

- Pipeline: `dokimos-app-v2/docs/VERIFICATION_FLOW.md`
- Debug: `dokimos-app-v2/docs/verification-debug-checklist.md`
