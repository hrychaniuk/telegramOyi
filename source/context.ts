import { Context } from 'telegraf';
import I18n from 'telegraf-i18n';

export interface Session {
	page?: number;
	login?: string;
	password?: string;
	token?: string;
	lastSession?: number;
	/** automatic */
	autoLog?: string;
	autoLogout?: string;
	/** notify */
	disableNotifyBirthday: boolean;
	disableNotifyBlog: boolean;
	/** clockify */
	clockify?: {
		uid: any;
		login: string;
		password: string;
		token?: string;
		workspace?: number;
		workspaceName?: string;
	}
}

export interface MyContext extends Context {
	i18n: I18n;
	session: Session;
}
