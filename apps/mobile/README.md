# Moments — mobile app

Expo / React Native app. App shell and route tree land in F7 (KAN-30).

```ts
// API access goes through the generated client (F6):
import { ApiClient, useHealth } from "@moments/api-client";

const client = new ApiClient(process.env.EXPO_PUBLIC_API_URL!);
const { data } = useHealth(client);
```

Re-run `pnpm gen:client` after API contract changes — CI fails on a stale client.
