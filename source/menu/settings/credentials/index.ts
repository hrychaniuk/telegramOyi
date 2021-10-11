import { MenuTemplate } from 'telegraf-inline-menu';

import deleteCredMenu from './deleteCred';
import { backButtons } from '@/menu/general';
import { MyContext } from '@/context';
import { scenes } from '@/modules/Scenes'

export const menu = new MenuTemplate<MyContext>(_context => 
	'Менеджер облікових даних'	
);

menu.interact('🔠 Переглянути облікові дані', 'show-creadentials', {
	do: async (context: any) => {
		context.replyWithMarkdown(
			`Portal: ` + '\n' +
			`Login: *${context.session.login || ''}*` + '\n' +
			`Password: *${'@'.repeat(context.session.password?.length || 0)}*` + '\n\n' +
			`Clockify: ` + '\n' +
			`Login: *${context.session.clockify?.login || ''}*` + '\n' +
			`Password: *${'@'.repeat(context.session.clockify?.password?.length || 0)}*`
		)
		return true;
    }
})

menu.interact('🔢 Змінити облікові дані порталу', 'set-creadentials', {
	do: async (context: any) => {
		context.scene.enter(scenes.FORM_SET_USER_CREDENTIALS)
		return true;
    }
})

menu.interact('🔢 Змінити облікові дані Clockify', 'set-creadentials-clockify', {
	do: async (context: any) => {
		context.scene.enter(scenes.FORM_SET_CLOCKIFY_CREDENTIALS)
		return true;
    }
})

menu.submenu(_context => '❗️ Видалити усі облікові дані ❗️', 'delete-creadentials', deleteCredMenu);

menu.manualRow(backButtons);
