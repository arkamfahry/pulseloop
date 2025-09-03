import { vWorkflowId } from '@convex-dev/workflow';
import { vResultValidator } from '@convex-dev/workpool';
import { internalMutation } from './_generated/server';
import { workflow } from '.';
import { v } from 'convex/values';

export const cleanupWorkflow = internalMutation({
	args: {
		workflowId: vWorkflowId,
		result: vResultValidator,
		context: v.any()
	},
	handler: async (ctx, args) => {
		await workflow.cleanup(ctx, args.workflowId);
	}
});
