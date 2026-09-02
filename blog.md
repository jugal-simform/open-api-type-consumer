# Swagger to TypeScript: Fully Automated Type Safety

If your frontend and backend are separate codebases, you've lived this bug: the backend renames a field, nobody tells the frontend team, and it blows up in production three weeks later.

The result is `any` types everywhere and manually written interfaces that drift out of sync the moment someone touches a controller. The fix isn't discipline or more code reviews — it's automation.

By generating your TypeScript types directly from your backend's OpenAPI (Swagger) schema on every build, a backend contract change becomes a TypeScript compile error on the frontend, not a runtime surprise. This post walks through exactly how we implement this in production with zero hand-written API types.

## The Technical Stack

Three packages do the heavy lifting to bridge the gap between your schema and your UI:

- **[openapi-typescript](https://www.npmjs.com/package/openapi-typescript)**: Reads an OpenAPI/Swagger schema (JSON or a live URL) and generates a single TypeScript file full of types: every path, method, request body, and response shape.
- **[openapi-fetch](https://www.npmjs.com/package/openapi-fetch)**: A tiny (~6KB) fetch wrapper that consumes those generated types. You get full autocomplete on paths and params with no heavy codegen for client methods.
- **[openapi-react-query](https://www.npmjs.com/package/openapi-react-query)**: Wraps openapi-fetch in React Query, providing `useQuery` and `useMutation` hooks that are fully typed against your schema with no manual query-key management.

## Step 1: The Backend Source of Truth

The process begins with the backend serving an OpenAPI schema. Whether you use Express, Fastify, or NestJS, the goal is a live `swagger.json` endpoint.

**Option A: Fastify/Express**

Using libraries like `@fastify/swagger`, the schema lives right next to the route:

```javascript
fastify.get('/users/:id', {
  schema: {
    params: { type: 'object', properties: { id: { type: 'string' } } },
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
        },
      },
    },
  },
}, async (request) => {
  return getUserById(request.params.id);
});
```

**Option B: NestJS**

NestJS generates OpenAPI directly from DTOs and decorators:

```typescript
@ApiTags('users')
@Controller('users')
export class UsersController {
  @Get(':id')
  @ApiOkResponse({ type: UserDto })
  getUser(@Param('id') id: string): Promise<UserDto> {
    return this.usersService.findOne(id);
  }
}
```

## Step 2: Automatic Type Generation (Script - FE)

Instead of downloading files manually, use a script to hit the backend's schema URL. This ensures your frontend types always reflect the current state of the backend.

`scripts/gen-types.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

# URL source, in priority order:
#   1. First CLI arg:        npm run gen:types -- http://api.example.com/openapi.json
#   2. SWAGGER_URL env var:  SWAGGER_URL=http://api.example.com/openapi.json npm run gen:types
#   3. Default below.
DEFAULT_URL="http://localhost:8080/swagger.json"
URL="${1:-${SWAGGER_URL:-$DEFAULT_URL}}"
OUT="src/types/api.d.ts"

mkdir -p "$(dirname "$OUT")"

echo "Generating types from: $URL"
npx openapi-typescript "$URL" -o "$OUT"
```

Wire it into `package.json` so it's a normal part of the frontend workflow, not a command someone has to remember to run:

`package.json`

```json
{
  "scripts": {
    "gen:types": "bash scripts/gen-types.sh",
    "prebuild": "npm run gen:types",
    "build": "tsc -b && vite build"
  }
}
```

The `prebuild` hook is what matters for production: npm runs it automatically before `build`, so every production build regenerates types from the live backend schema first. If the backend is unreachable or the schema drifted, the build fails at type generation or the subsequent type check instead of shipping stale types.

Running `npm run gen:types` generates `src/types/api.d.ts`. This file is a build artifact; you should never edit it by hand.

## Step 3: Wiring the Typed Client

Once types are generated, we initialize the fetch client and the React Query wrapper.

```typescript
// src/lib/api/client.ts
import createFetchClient from 'openapi-fetch';
import createClient from 'openapi-react-query';
import type { paths } from './types';

export const fetchClient = createFetchClient<paths>({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
});

export const api = createClient(fetchClient);
```

By passing `<paths>` to the client, every method and hook is now strictly typed against your backend's exact specifications.

## Step 4: Implementation in Components

This is where the investment pays off. You no longer need to declare `interface User` or `interface APIResponse`.

On openapi-typescript v7+, `paths[path][method]` and its `parameters` object are always present — only the individual `query`/`path`/`header` keys are optional (`?: never` when unused). So a single `NonNullable` around `query` is all you need; wrapping the whole `parameters` object too is a no-op left over from v6-era generated types.

```typescript
import { api } from '@/lib/api/client';
import type { paths } from '@/lib/api/types';

type BlogListingQuery = NonNullable<paths['/admin/blogs']['get']['parameters']['query']>;

export function useBlogListing(queryOverrides?: Partial<BlogListingQuery>) {
  const query = {
    page: 1,
    per_page: 10,
    ...queryOverrides,
  } satisfies BlogListingQuery;

  return api.useQuery(
    'get',
    '/admin/blogs',
    { params: { query } }
  );
}
```

**Why this matters:**

- **Contract Enforcement**: If the backend adds a required query param, your frontend won't compile until you provide it.
- **No Typos**: Autocomplete lists every available path. A typo in a URL is now a compile error.
- **Refactor Safety**: If a field is renamed in the backend, every component reading that field will immediately flag an error.

## The Workflow Payoff

The end-to-end flow creates a bulletproof contract:

`Backend Route → OpenAPI Schema → Generated Types → Typed Hooks → Safe Components`

By making the type-generation script part of your CI/CD — failing the build if `types.ts` is out of sync with the schema — you eliminate an entire category of production bugs. You move from "hoping the API didn't change" to "knowing exactly what to fix" before the code is even merged.

---

Full working example (Fastify + NestJS backends, file-storage, wired React frontend): [github.com/jugal-simform/cuisine-core](https://github.com/jugal-simform/cuisine-core)

*Author: Jugal Kundaliya*