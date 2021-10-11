import { MenuTemplate } from 'telegraf-inline-menu';

import { backButtons } from '../general';
import { MyContext } from '@/context';
import autoLogMenu from './autoLog';
import autoLogoutMenu from './autoLogout';

export const menu = new MenuTemplate<MyContext>(_context => 
	'Тут зберігаються заплановані події, які будуть виконуватись автоматично.'	
);

menu.submenu(ctx => (ctx.session.autoLog ? '✅' : '🔄') + ' Автологування', 'auto-login', autoLogMenu);
menu.submenu(ctx => (ctx.session.autoLogout ? '✅' : '🔄') + ' Автовилоговування', 'auto-logout', autoLogoutMenu);

menu.manualRow(backButtons);
