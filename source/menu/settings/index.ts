import { MenuTemplate } from 'telegraf-inline-menu';

import { backButtons } from '../general';
import { MyContext } from '@/context';

/** submenu */
import notifyMenu from './notify';
import { menu as menuCreadentials } from './credentials'

export const menu = new MenuTemplate<MyContext>(_context => 'Налаштування для зміни особистих даних для логування та сповіщень.');

menu.submenu(_ctx => '👨 Особисті дані', 'creds', menuCreadentials);
menu.submenu(_context => '🔔 Сповіщення', 'notifications', notifyMenu);

menu.manualRow(backButtons);
