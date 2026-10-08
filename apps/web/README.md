# Moments — web app

Web client. Landing/deep-link surfaces land in E14 (KAN-17 dependencies).

```ts
// API access goes through the generated client (F6):
import { ApiClient, useHealth, useCreateMoment } from "@moments/api-client";

const client = new ApiClient(process.env.NEXT_PUBLIC_API_URL!);
const createMoment = useCreateMoment(client); // optimistic updates included
```

Re-run `pnpm gen:client` after API contract changes — CI fails on a stale client.
