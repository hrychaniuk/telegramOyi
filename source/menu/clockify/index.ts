// import get from 'lodash/get';
import { MenuTemplate } from 'telegraf-inline-menu';
import { scenes } from '@/modules/Scenes'
import { parse } from '@/modules/ClockifyParser'

import { backButtons } from '../general';
import { MyContext } from '@/context';
import { deleteAfter } from '@/helper';
import { getLastTrack, stopLastTrack } from '@/scenes/tracker';
import { menu as portalMenu } from '../portal';
import axios from 'axios';
import moment from 'moment';

export const menu = new MenuTemplate<MyContext>(ctx => 
	'Clockify спрощує відслідковування задач, пропонує шаблонні описи та має актуальний список проєктів. До "проєктів" відносяться лише ті, які позначені міткою ⭐ (улюблені) у веб-порталі Clockify. Приємного користування.' + '\n\n' +
	(ctx.session.clockify?.workspaceName ? ('🧩 Workspace: ' + ctx.session.clockify?.workspaceName) : '‼️ Для встановлення облікових даних перейдіть у налаштування - /settings')
);

export const getMyProjects = async (ctx: MyContext) => {
	const wpid = ctx.session.clockify?.workspace
	const uid = ctx.session.clockify?.uid
	const { data } = await axios.get(`https://global.api.clockify.me/workspaces/${wpid}/users/${uid}/projects/favorites/${uid}/detailed`, {
			headers: {
				'x-auth-token': ctx.session.clockify?.token
			}
	})
	return data
}

export const setClockifyToken = async (ctx: MyContext) => {
	if(!ctx.session.clockify) throw new Error();

	const response = await axios.post('https://global.api.clockify.me/auth/token', {
		email: ctx.session.clockify?.login,
		password: ctx.session.clockify?.password
	});
	ctx.session.clockify.token = response.data.token;

	return response
}

const statusHandler = async (ctx: MyContext) => {
    try {
        await setClockifyToken(ctx)

		const tracker = await getLastTrack({ ctx })
		if(tracker) {
			const time = moment.duration(moment().diff(moment(tracker.timeInterval.start)));
			const formatted = moment.utc(time.asMilliseconds()).format("HH:mm:ss");

			return ctx.answerCbQuery(`🕔 ${tracker.project?.name || 'Без назви'} / ${formatted} / ${tracker.description} 🕗`)
		} else {
			return ctx.answerCbQuery(`✅ Ваші облікові дані вірні`);
		}			
    } catch(e) {
        return ctx.answerCbQuery('❌ Можливо ваші облікові дані не вірні');
    }
}

const finishHandler = async (ctx: MyContext) => {
    try {
        await setClockifyToken(ctx)

		const { stoped, stopedError } = await stopLastTrack({ ctx })

		if(stopedError) throw new Error();
		if(stoped) await deleteAfter(ctx.reply('✅ Усі завдання були зупинені'), ctx, 3);
		if(!stoped) await deleteAfter(ctx.reply('✅ Немає що зупиняти'), ctx, 3);

		return true
    } catch(e) {
        return ctx.answerCbQuery('❌ Можливо ваші облікові дані не вірні');
    }
}

const tableHandler = async (ctx: MyContext) => {
	let message_id: any
    try {
		await setClockifyToken(ctx)
		message_id = (await ctx.reply('🌀 Починаю рендерити'))?.message_id
		const buffer = await parse({ ctx });
		await ctx.replyWithPhoto({ source: Buffer.from(buffer) })
		return true
    } catch(e) {
        return ctx.answerCbQuery('❌ Можливо ваші облікові дані не вірні');
    } finally {
		if(message_id) await deleteAfter({ message_id }, ctx, 0);
	}
}

menu.interact('🔄 Статус', 'clockify-refresh', { do: statusHandler });
menu.interact('🚀 Трекаємо!', 'clockify-track', { do: async (ctx: any) => {
	try {
		await setClockifyToken(ctx);
		ctx.scene.enter(scenes.FORM_TRACKER);
		return true;
	} catch(e) {
        return ctx.answerCbQuery('❌ Можливо ваші облікові дані не вірні');
	}
} });
menu.interact('🏁 Завершити', 'clockify-done', { do: finishHandler });
menu.interact('📸 Таблиця часу', 'clockify-table', { do: tableHandler });
menu.submenu('🌕 OYI Portal', 'oyi-portal-menu', portalMenu);

menu.manualRow(backButtons);
