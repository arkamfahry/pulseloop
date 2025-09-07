import workflow from '@convex-dev/workflow/convex.config';
import { defineApp } from 'convex/server';
import betterAuth from '@convex-dev/better-auth/convex.config';
import aggregate from '@convex-dev/aggregate/convex.config';

const app = defineApp();

app.use(workflow);
app.use(betterAuth);
app.use(aggregate);

export default app;
