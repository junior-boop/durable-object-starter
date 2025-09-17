import { QueryOptions, WhereConditions, OrderByOptions } from './simpleorm-sync';
// import { DurableObject, DurableObjectState } from '@cloudflare/workers-types';

export interface Env {
	// Définissez ici vos variables d'environnement
	[key: string]: any;
}

interface DatabaseRow {
	id?: string | number;
	created?: string;
	modified?: string;
	[key: string]: any;
}

interface IndexEntry {
	[key: string]: string;
}

interface DurableState {
	storage: DurableObjectStorage;
}

interface IndexConfig {
	name: string;
	fields: string[];
	unique?: boolean;
}

export class DurableModel implements DurableObject {
	private storage: DurableObjectStorage;
	private env: Env;
	private tableName: string;
	private indexes: IndexConfig[];

	constructor(state: DurableObjectState, env: Env, tableName: string, indexes: IndexConfig[] = []) {
		this.storage = state.storage;
		this.env = env;
		this.tableName = tableName;
		this.indexes = indexes;
	}

	async fetch(request: Request): Promise<Response> {
		// Implémentation de base de l'interface DurableObject
		return new Response('Not implemented', { status: 501 });
	}

	// Méthodes utilitaires privées
	private async getNextId(): Promise<string> {
		let currentId = await this.storage.get(`${this.tableName}_counter`);
		const nextId = (typeof currentId === 'number' ? currentId : 0) + 1;
		await this.storage.put(`${this.tableName}_counter`, nextId);
		return nextId.toString();
	}

	private async updateIndexes(record: DatabaseRow, operation: 'add' | 'remove'): Promise<void> {
		for (const index of this.indexes) {
			const indexKey = index.fields.map((field) => record[field] ?? '').join(':');
			const indexName = `${this.tableName}_${index.name}`;
			const existingIndex: Record<string, string> = (await this.storage.get(indexName)) || {};

			if (operation === 'add') {
				if (index.unique && existingIndex[indexKey]) {
					throw new Error(`Index violation: ${index.name} must be unique (value: ${indexKey})`);
				}
				existingIndex[indexKey] = record.id as string;
			} else {
				delete existingIndex[indexKey];
			}

			await this.storage.put(indexName, existingIndex);
		}
	}

	// Méthodes CRUD principales
	async create<T extends DatabaseRow>(data: Partial<T>): Promise<T> {
		// const id = await this.getNextId();
		const timestamp = new Date().toISOString();
		const record = {
			id: data.id,
			...data,
			created: timestamp,
			modified: timestamp,
		} as T;

		await this.storage.put(`${this.tableName}:${data.id}`, record);
		await this.updateIndexes(record, 'add');

		return record;
	}

	async createMany<T extends DatabaseRow>(records: Partial<T>[]): Promise<T[]> {
		const results: T[] = [];
		for (const record of records) {
			const result = await this.create(record);
			results.push(result);
		}
		return results;
	}

	async findById<T extends DatabaseRow>(id: string | number): Promise<T | null> {
		const result = await this.storage.get(`${this.tableName}:${id}`);
		return result as T | null;
	}

	async findAll<T extends DatabaseRow>(options: QueryOptions = {}): Promise<T[]> {
		const { where = {}, orderBy, limit, offset = 0 } = options;
		let results: T[] = [];

		// Récupérer tous les enregistrements qui commencent par le préfixe de la table
		const allRecords = await this.storage.list({
			prefix: `${this.tableName}:`,
		});

		for await (const [key, value] of allRecords.entries()) {
			results.push(value as T);
		}

		// Appliquer les filtres
		results = this.applyFilters(results, where);

		// Appliquer le tri
		if (orderBy) {
			results = this.applySorting(results, orderBy);
		}

		// Appliquer la pagination
		if (typeof limit === 'number') {
			results = results.slice(offset, offset + limit);
		}

		return results;
	}

	async findOne<T extends DatabaseRow>(options: QueryOptions): Promise<T | null> {
		const results = await this.findAll<T>({ ...options, limit: 1 });
		return results[0] || null;
	}

	async update<T extends DatabaseRow>(id: string | number, data: Partial<T>): Promise<T | null> {
		const existing = await this.findById<T>(id);
		if (!existing) return null;

		// Supprimer les anciens index
		await this.updateIndexes(existing, 'remove');

		const updated = {
			...existing,
			...data,
			modified: new Date().toISOString(),
		} as T;

		await this.storage.put(`${this.tableName}:${id}`, updated);
		await this.updateIndexes(updated, 'add');

		return updated;
	}

	async updateWhere<T extends DatabaseRow>(conditions: WhereConditions, data: Partial<T>): Promise<number> {
		const records = await this.findAll<T>({ where: conditions });
		let updatedCount = 0;

		for (const record of records) {
			const updated = await this.update(record.id!, data);
			if (updated) updatedCount++;
		}

		return updatedCount;
	}

	async delete(id: string | number): Promise<boolean> {
		const existing = await this.findById(id);
		if (!existing) return false;

		await this.updateIndexes(existing, 'remove');
		await this.storage.delete(`${this.tableName}:${id}`);
		return true;
	}

	async deleteWhere(conditions: WhereConditions): Promise<number> {
		const records = await this.findAll({ where: conditions });
		let deletedCount = 0;

		for (const record of records) {
			const deleted = await this.delete(record.id!);
			if (deleted) deletedCount++;
		}

		return deletedCount;
	}

	async upsert<T extends DatabaseRow>(data: Partial<T>): Promise<T> {
		if (data.id) {
			const existing = await this.findById<T>(data.id);
			if (existing) {
				return (await this.update(data.id, data))!;
			}
		}
		return await this.create(data);
	}

	async upsertWithCoalesce<T extends DatabaseRow>(data: Partial<T>): Promise<T> {
		if (data.id) {
			const existing = await this.findById<T>(data.id);
			if (existing) {
				// Ne mettre à jour que les champs non nuls
				const updateData = Object.fromEntries(Object.entries(data).filter(([_, value]) => value != null));
				return (await this.update(data.id, updateData))!;
			}
		}
		return await this.create(data);
	}

	// Méthodes utilitaires
	private applyFilters<T>(records: T[], conditions: WhereConditions): T[] {
		return records.filter((record) => {
			return Object.entries(conditions).every(([key, value]) => {
				if (typeof value === 'object' && value !== null) {
					// Gérer les opérateurs spéciaux ($gt, $lt, etc.)
					return this.evaluateCondition(record[key], value);
				}
				return record[key] === value;
			});
		});
	}

	private evaluateCondition(fieldValue: unknown, condition: Record<string, unknown>): boolean {
		for (const [operator, value] of Object.entries(condition)) {
			if (typeof fieldValue !== 'number' || typeof value !== 'number') {
				continue;
			}

			switch (operator) {
				case '$gt':
					if (!(fieldValue > value)) return false;
					break;
				case '$gte':
					if (!(fieldValue >= value)) return false;
					break;
				case '$lt':
					if (!(fieldValue < value)) return false;
					break;
				case '$lte':
					if (!(fieldValue <= value)) return false;
					break;
				case '$ne':
					if (fieldValue === value) return false;
					break;
				case '$in':
					if (!Array.isArray(value) || !value.includes(fieldValue)) return false;
					break;
				case '$nin':
					if (!Array.isArray(value) || value.includes(fieldValue)) return false;
					break;
			}
		}
		return true;
	}

	private applySorting<T extends Record<string, any>>(records: T[], orderBy: OrderByOptions | OrderByOptions[]): T[] {
		const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];

		return [...records].sort((a, b) => {
			for (const { column, direction = 'ASC' } of orderByArray) {
				const aVal = a[column];
				const bVal = b[column];
				if (aVal < bVal) return direction === 'ASC' ? -1 : 1;
				if (aVal > bVal) return direction === 'ASC' ? 1 : -1;
			}
			return 0;
		});
	}
}

export class DurableObjectAdapter implements DurableObject {
	private models: Map<string, DurableModel> = new Map();

	constructor(private state: DurableObjectState, private env: Env) {}

	async fetch(request: Request): Promise<Response> {
		// Implémentation de base de l'interface DurableObject
		return new Response('Not implemented', { status: 501 });
	}

	defineModel(tableName: string, indexes: IndexConfig[] = []): DurableModel {
		if (this.models.has(tableName)) {
			return this.models.get(tableName)!;
		}

		const model = new DurableModel(this.state, this.env, tableName, indexes);
		this.models.set(tableName, model);
		return model;
	}
}
