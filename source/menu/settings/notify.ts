import { MenuTemplate } from 'telegraf-inline-menu';
import { MyContext } from '@/context';
import { backButtons } from '../general';
import { deleteAfter } from '@/helper'
// import { db } from '@/modules/Session';
// import Extra from 'telegraf/extra';
// import Markup from 'telegraf/markup';

const menu = new MenuTemplate<MyContext>(_context => {
	return 'Налаштування сповіщень'
});

menu.interact(ctx => (ctx.session.disableNotifyBirthday ? '🔕' : '🔔') + ' Дні народження', 'notify-birthday', {
	do: async ctx => {
        ctx.session.disableNotifyBirthday = !ctx.session.disableNotifyBirthday;
        await deleteAfter(ctx.reply('❤️ Успішно змінено.'), ctx);
        return true;
    }
})

menu.interact(ctx => (ctx.session.disableNotifyBlog ? '🔕' : '🔔') + ' Блог', 'notify-blog', {
	do: async ctx => {
        ctx.session.disableNotifyBlog = !ctx.session.disableNotifyBlog;
        await deleteAfter(ctx.reply('❤️ Успішно змінено.'), ctx);
        return true;
    }
})

// menu.interact(ctx => (ctx.session.disableNotifyBirthday ? '🔕' : '🔔') + ' Blah', 'notify-birthdays', {
// 	do: async ctx => {
//         const coworkers = db.get('coworkers');
//         await ctx.reply('Виберіть користувача, зля зміну стану нотифікації!', Extra.markup(
//             Markup.keyboard([...coworkers.map((item: any) => `${item.name}`)])
//         ))
//         return true;
//     }
// })

menu.manualRow(backButtons);

export default menu