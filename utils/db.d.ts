export type Notes = {
	id: string;
	body: string;
	creator: string;
	pinned: 0 | 1;
	archived: 0 | 1;
	grouped: string | null;
	created: Date;
	modified: Date;
};

export type User = {
	id: string;
	name: string;
	email: string;
	created: string;
	modified: string;
	lastlogin: string;
	lastlogout: string;
};

export type Groups = {
	id: string;
	name: string;
	created: Date;
	modified: Date;
};

export type Session = {
	id: string;
	iduser: string;
	name?: string;
	email?: string;
};

export type UserInput = {
	name: string;
	email: string;
	lastlogin: string;
	lastlogout: string;
};

export type DeletedNote = {
	id: string;
};

export type ModifiedNote = {
	id: string;
	body: string;
	modified: number;
};

export type ArchivedNote = {
	id: string;
	archived: boolean;
};

export type GroupedLink = {
	id: string;
	grouped: string;
};

export type PinningNote = {
	id: string;
	pinned: boolean;
};

export type usersession = {
	id: string;
	iduser: string;
	name: string;
	email: string;
};
