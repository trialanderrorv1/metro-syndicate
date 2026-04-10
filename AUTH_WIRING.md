# Auth wiring patch

This patch adds route files only. It does not overwrite your existing `server/app.ts`.

## 1) Copy the files
- `server/live-readiness/authRoutes.ts`
- `server/live-readiness/premiumRuntime.ts`

## 2) Edit `server/app.ts`
Add this import near your other imports:

```ts
import { authRouter } from "./live-readiness/authRoutes";
```

Then mount the router after `app.use(express.json(...))`:

```ts
app.use("/auth", authRouter);
```

## 3) Regenerate Prisma client

```powershell
cd "C:\Users\Dean\OneDrive\Documents\Metro-Syndicate-clean"
npm.cmd run prisma:generate
```

## 4) Restart the API

```powershell
cd "C:\Users\Dean\OneDrive\Documents\Metro-Syndicate-clean"
npm.cmd run start:api
```

## 5) Test endpoints

Register body:
```json
{
  "handle": "DeanTest",
  "email": "dean@example.com",
  "password": "strongpassword123"
}
```

Login body:
```json
{
  "identifier": "DeanTest",
  "password": "strongpassword123"
}
```
