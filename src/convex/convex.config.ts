import { defineApp } from 'convex/server';
import workflow from '@convex-dev/workflow/convex.config';
import betterAuth from '@convex-dev/better-auth/convex.config';
import aggregate from '@convex-dev/aggregate/convex.config';
import shardedCounter from '@convex-dev/sharded-counter/convex.config';

const app = defineApp();

app.use(workflow);
app.use(betterAuth);
app.use(aggregate);
app.use(shardedCounter);

export default app;
