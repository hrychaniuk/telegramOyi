import { createBackMainMenuButtons } from 'telegraf-inline-menu';
import { MyContext } from '@/context';

export const backButtons = createBackMainMenuButtons<MyContext>(
	_context => '⬅️ Повернутись назад',
	_context => '⏺ Головне меню'
);