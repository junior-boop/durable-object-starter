export { NotesObject } from '../utils/notes-object';
export default {
	async fetch(request, env, ctx): Promise<Response> {
		const DO = await env.MY_DURABLE_OBJECT.get(env.MY_DURABLE_OBJECT.idFromName('default'));
		const response = await DO.fetch(request);

		return response;
	},
} satisfies ExportedHandler<Env>;
