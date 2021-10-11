import { MenuTemplate } from 'telegraf-inline-menu';
import { MyContext } from '@/context';
import { menu as settingsMenu } from './settings';
import { menu as clockifyMenu } from './clockify';
import { menu as portalMenu } from './portal';


export const menu = new MenuTemplate<MyContext>(context => {
    const session = context.session || {}
    const unLogged = !session.login || !session.password

    return {
        text: `👋 Йоу, *${context.from?.first_name}*! Файне рішення для трекінгу часу та отримання сповіщень на порталі *OTAKOYI*. Налаштування сповіщень та облікових записів - /settings`
        + (unLogged ? ('\n\n' + `У першу чергу використай налаштування для створення облікового запису, який буде використовуватись, щоб логувати тебе у системі.`) : ''), 
        parse_mode: 'Markdown'
    }; 
});

menu.submenu(_ctx => '🌕 OYI Portal', 'oyi-portal', portalMenu);
menu.submenu(_ctx => '🔵 Clockify Tracker', 'clockify', clockifyMenu);
menu.submenu(_ctx => '⚙️ Налаштування', 'settings', settingsMenu);
