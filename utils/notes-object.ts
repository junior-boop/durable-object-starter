import { DurableObjectAdapter } from './durable-object';
import { Notes, User, Groups } from './db';

export interface Env {
	// Définissez vos variables d'environnement
	NOTES_OBJECT: DurableObjectNamespace;
	[key: string]: any;
}

export class NotesObject implements DurableObject {
	state: DurableObjectState;
	adapter: DurableObjectAdapter;

	constructor(state: DurableObjectState, env: Env) {
		this.state = state;
		this.adapter = new DurableObjectAdapter(this.state, env);

		// Définir les modèles avec leurs index
		this.adapter.defineModel('notes', [
			{
				name: 'creator_idx',
				fields: ['creator'],
			},
			{
				name: 'grouped_idx',
				fields: ['grouped'],
			},
		]);

		this.adapter.defineModel('users', [
			{
				name: 'email_idx',
				fields: ['email'],
				unique: true,
			},
		]);

		this.adapter.defineModel('groups', [
			{
				name: 'name_idx',
				fields: ['name'],
			},
		]);
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const method = request.method;
		const notesModel = this.adapter.defineModel('notes');
		const usersModel = this.adapter.defineModel('users');
		const groupsModel = this.adapter.defineModel('groups');

		if (url.pathname === '/') {
			if (method === 'GET') {
				console.log('je suis dans la joie');
				return new Response('je suis dans la joie', {
					headers: { 'Content-Type': 'application/json' },
				});
			}
		}

		// Gestionnaire de routes pour les notes
		if (url.pathname.startsWith('/notes')) {
			switch (method) {
				case 'GET': {
					if (url.pathname === '/notes') {
						const notes = await notesModel.findAll({
							orderBy: { column: 'modified', direction: 'DESC' },
						});
						return new Response(JSON.stringify(notes), {
							headers: { 'Content-Type': 'application/json' },
						});
					}

					const noteId = url.pathname.split('/')[2];
					console.log('noteId', noteId);
					console.log('url', url.pathname.split('/')[2]);
					if (noteId) {
						const note = await notesModel.findById(noteId);
						if (!note) {
							return new Response('Note not found', { status: 404 });
						}
						return new Response(JSON.stringify(note), {
							headers: { 'Content-Type': 'application/json' },
						});
					}
					break;
				}

				case 'POST': {
					const data = (await request.json()) as Notes;
					const note = await notesModel.create(data);
					return new Response(JSON.stringify(note), {
						status: 201,
						headers: { 'Content-Type': 'application/json' },
					});
				}

				case 'PUT': {
					const noteId = url.pathname.split('/')[2];
					if (!noteId) {
						return new Response('Note ID required', { status: 400 });
					}
					const data = (await request.json()) as Partial<Notes>;
					const note = await notesModel.update(noteId, data);
					if (!note) {
						return new Response('Note not found', { status: 404 });
					}
					return new Response(JSON.stringify(note), {
						headers: { 'Content-Type': 'application/json' },
					});
				}

				case 'DELETE': {
					const noteId = url.pathname.split('/')[2];
					if (!noteId) {
						return new Response('Note ID required', { status: 400 });
					}
					const success = await notesModel.delete(noteId);
					if (!success) {
						return new Response('Note not found', { status: 404 });
					}
					return new Response(null, { status: 204 });
				}
			}
		}

		// Gestionnaire de routes pour les utilisateurs
		if (url.pathname.startsWith('/users')) {
			switch (method) {
				case 'GET': {
					if (url.pathname === '/users') {
						const users = await usersModel.findAll({
							orderBy: { column: 'modified', direction: 'DESC' },
						});
						return new Response(JSON.stringify(users), {
							headers: { 'Content-Type': 'application/json' },
						});
					}

					const userId = url.pathname.split('/')[2];
					if (userId) {
						const user = await usersModel.findById(userId);
						if (!user) {
							return new Response('User not found', { status: 404 });
						}
						return new Response(JSON.stringify(user), {
							headers: { 'Content-Type': 'application/json' },
						});
					}
					break;
				}

				case 'POST': {
					const data = (await request.json()) as User;
					const user = await usersModel.create(data);

					return new Response(JSON.stringify(user), {
						status: 201,
						headers: { 'Content-Type': 'application/json' },
					});
				}

				case 'PUT': {
					const userId = url.pathname.split('/')[2];
					if (!userId) {
						return new Response('User ID required', { status: 400 });
					}
					const data = (await request.json()) as Partial<User>;
					const user = await usersModel.update(userId, data);
					if (!user) {
						return new Response('User not found', { status: 404 });
					}
					return new Response(JSON.stringify(user), {
						headers: { 'Content-Type': 'application/json' },
					});
				}

				case 'DELETE': {
					const userId = url.pathname.split('/')[2];
					if (!userId) {
						return new Response('User ID required', { status: 400 });
					}
					const success = await usersModel.delete(userId);
					if (!success) {
						return new Response('User not found', { status: 404 });
					}
					return new Response(null, { status: 204 });
				}
			}
		}

		// Gestionnaire de routes pour les groupes
		if (url.pathname.startsWith('/groups')) {
			switch (method) {
				case 'GET': {
					if (url.pathname === '/groups') {
						const groups = await groupsModel.findAll({
							orderBy: { column: 'modified', direction: 'DESC' },
						});
						return new Response(JSON.stringify(groups), {
							headers: { 'Content-Type': 'application/json' },
						});
					}

					const groupId = url.pathname.split('/')[2];
					if (groupId) {
						const group = await groupsModel.findById(groupId);
						if (!group) {
							return new Response('Group not found', { status: 404 });
						}
						return new Response(JSON.stringify(group), {
							headers: { 'Content-Type': 'application/json' },
						});
					}
					break;
				}

				case 'POST': {
					const data = (await request.json()) as Groups;
					const group = await groupsModel.create(data);
					return new Response(JSON.stringify(group), {
						status: 201,
						headers: { 'Content-Type': 'application/json' },
					});
				}

				case 'PUT': {
					const groupId = url.pathname.split('/')[2];
					if (!groupId) {
						return new Response('Group ID required', { status: 400 });
					}
					const data = (await request.json()) as Partial<Groups>;
					const group = await groupsModel.update(groupId, data);
					if (!group) {
						return new Response('Group not found', { status: 404 });
					}
					return new Response(JSON.stringify(group), {
						headers: { 'Content-Type': 'application/json' },
					});
				}

				case 'DELETE': {
					const groupId = url.pathname.split('/')[2];
					if (!groupId) {
						return new Response('Group ID required', { status: 400 });
					}
					const success = await groupsModel.delete(groupId);
					if (!success) {
						return new Response('Group not found', { status: 404 });
					}
					return new Response(null, { status: 204 });
				}
			}
		}

		return new Response('Not found', { status: 404 });
	}

	async alarm(): Promise<void> {
		// Logique pour les tâches programmées
		// Par exemple, nettoyage des notes archivées anciennes
		const notesModel = this.adapter.defineModel('notes');
		const usersModel = this.adapter.defineModel('users');
		const groupsModel = this.adapter.defineModel('groups');
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		await notesModel.deleteWhere({
			archived: true,
			modified: { $lt: thirtyDaysAgo.toISOString() },
		});
		await usersModel.deleteWhere({
			archived: true,
			modified: { $lt: thirtyDaysAgo.toISOString() },
		});
		await groupsModel.deleteWhere({
			archived: true,
			modified: { $lt: thirtyDaysAgo.toISOString() },
		});
	}
}
