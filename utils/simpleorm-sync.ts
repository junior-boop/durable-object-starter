// Types utilitaires pour le ModelFactory
export type ModelKeys<T> = {
	[K in keyof T]: K;
};

export type ModelTypes<T> = {
	[K in keyof T]: T[K] extends string
		? 'string'
		: T[K] extends number
		? 'number'
		: T[K] extends boolean
		? 'boolean'
		: T[K] extends Date
		? 'date'
		: 'any';
};

// Interface pour les modèles avec métadonnées
export interface ModelWithMeta<T extends DatabaseRow> {
	keys: ModelKeys<T>;
	types: ModelTypes<T>;
	tableName: string;
}

// Query Builder pour enchaîner les méthodes
export interface QueryBuilder<T extends DatabaseRow> {
	where(conditions: WhereConditions): QueryBuilder<T>;
	orderBy(column: string, direction?: 'ASC' | 'DESC'): QueryBuilder<T>;
	limit(limit: number): QueryBuilder<T>;
	offset(offset: number): QueryBuilder<T>;
	include(options: IncludeOptions | IncludeOptions[]): QueryBuilder<T>;
	findAll(): Promise<T[]>;
	findOne(): Promise<T | null>;
	count(): Promise<number>;
}

// Interface pour les classes de modèle avec métadonnées
export interface ModelClass<T extends DatabaseRow> extends ModelWithMeta<T> {
	// new (data?: Partial<T>): ModelInstance<T>;
	createTable(): Promise<QueryResult>;
	create(data: Partial<T>): Promise<T>;
	findAll(options?: QueryOptions): Promise<T[]>;
	findById(id: string | number, options?: { include?: IncludeOptions | IncludeOptions[] }): Promise<T | null>;
	findOne(options: QueryOptions): Promise<T | null>;
	update(id: string | number, data: Partial<T>): Promise<T | null>;
	delete(id: string | number): Promise<boolean>;
	exists(conditions: WhereConditions): Promise<boolean>;
	where(conditions: WhereConditions): QueryBuilder<T>;
	orderBy(column: string, direction?: 'ASC' | 'DESC'): QueryBuilder<T>;
	limit(limit: number): QueryBuilder<T>;
	offset(offset: number): QueryBuilder<T>;
	include(options: IncludeOptions | IncludeOptions[]): QueryBuilder<T>;
	upsert(data: Partial<T>): T;
	upsertWithCoalesce(data: Partial<T>): T;
	createMany(dataArray: Partial<T>[]): T[];
	updateWhere(conditions: WhereConditions, data: Partial<T>): number;
	deleteWhere(conditions: WhereConditions): number;
}

// Types de base partagés
export interface QueryResult {
	lastInsertRowid?: number;
	changes: number;
}

export interface DatabaseRow {
	id?: string | number;
	[key: string]: any;
}

export interface WhereConditions {
	[key: string]: any;
}

export interface OrderByOptions {
	column: string;
	direction?: 'ASC' | 'DESC';
}

export interface IncludeOptions {
	model: string;
	foreignKey: string;
	localKey?: string;
	as?: string;
}

export interface QueryOptions {
	where?: WhereConditions;
	orderBy?: OrderByOptions | OrderByOptions[];
	limit?: number | undefined;
	offset?: number | undefined;
	include?: IncludeOptions | IncludeOptions[];
}

export interface TableSchema {
	[columnName: string]: string;
}

// Types pour la synchronisation
export interface SyncOperation {
	id: string;
	operation: 'CREATE' | 'UPDATE' | 'DELETE';
	tableName: string;
	recordId: string | number;
	data: Record<string, unknown>;
	timestamp: number;
	version: number;
	clientId: string;
	synced: boolean;
	retryCount?: number;
}

export interface SyncConfig {
	serverUrl: string;
	apiKey?: string;
	clientId: string;
	syncInterval?: number;
	retryAttempts?: number;
	enableRealtime?: boolean;
	conflictResolution?: 'client' | 'server' | 'latest' | 'custom';
	customConflictResolver?: (local: any, remote: any) => any;
}

export interface SyncStatus {
	isOnline: boolean;
	lastSync: Date | null;
	pendingOperations: number;
	isSyncing: boolean;
	errors: string[];
}

export interface RealtimeEvent {
	type: 'CREATE' | 'UPDATE' | 'DELETE';
	table: string;
	record: any;
	timestamp: number;
	clientId: string;
}
