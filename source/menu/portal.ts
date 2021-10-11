import axios from 'axios';
import moment from 'moment';
import get from 'lodash/get';
import shuffle from 'lodash/shuffle';
import { menu as planMenu } from './plan';
import { parse } from '@/modules/BlogParser';
import { MenuTemplate } from 'telegraf-inline-menu';
import { MyContext } from '@/context';
import { backButtons } from './general';

export const menu = new MenuTemplate<MyContext>(context => {
    const session = context.session || {}
    const unLogged = !session.login || !session.password

    return `OYI Portal дозволяє окрім звичайного відслідковування часу, також виконувати задачі автоматично.`
        + (unLogged ? ('\n\n' + `‼️ Для встановлення облікових даних перейдіть у налаштування - /settings`) : '')
});

export const login = async (ctx: any) => {
    const response = await axios.post("https://api.portal.otakoyi.com/api/v1/auth/login", {
        email: get(ctx.session, 'login'),
        password: get(ctx.session, 'password')
    })
    return response
}

export const logout = async (ctx: any) => {
    await axios.post("https://api.portal.otakoyi.com/api/v1/auth/logout", {}, {
        headers: {
            Authorization: `Bearer ${get(ctx.session, 'token')}`
        }
    })
}

export const status = async (ctx: any) => {
    const headers = { Authorization: `Bearer ${get(ctx.session, 'token')}` }
    const [, { data }] =  await Promise.all([
        axios.get("https://api.portal.otakoyi.com/api/v1/me", { headers }),
        axios.get("https://api.portal.otakoyi.com/api/v1/my-wt-today", { headers })
    ])

    return data.data;
}

const statusHandlerAnswears = [
    'Йой, ви не залоговані!',
    'Можете спробувати залогуватись!',
    'Не залогований.',
    'Певно уже розлогувався.'
]

const statusHandler = async (ctx: MyContext) => {
    if(!get(ctx.session, 'token')) {
        const [ result ] = shuffle(statusHandlerAnswears)
        return ctx.answerCbQuery(result)
    }
    try {
        const { today } = await status(ctx)
        const currentTime = moment.duration(today.total, 'seconds').format();
        return ctx.answerCbQuery(`🕔 Ви залоговані. На годиннику: ${currentTime} 🕗`)
    } catch(e) {
        ctx.session.token = "";
        return ctx.answerCbQuery('❤️ Сесія завершена з іншого пристрою. До побачення!')
    }
}

const loginHandler = async (ctx: MyContext) => {
    try {
        const { data } =  await login(ctx)
        ctx.session.token = data.token;
        ctx.session.lastSession = + new Date();
        return ctx.answerCbQuery('❤️ Успішно залоговано')
    } catch(e) {
        return ctx.answerCbQuery('Облікові дані не вірні')
    }
}

const logoutHandler = async (ctx: MyContext) => {
    if(!get(ctx.session, 'token')) {
        const [ result ] = shuffle(statusHandlerAnswears)
        return ctx.answerCbQuery(result)
    }
    try {
        await logout(ctx)
    } catch(e) {
        console.error('logout_error: ', e.message);
    } finally {
        ctx.session.token = "";
        return ctx.answerCbQuery('❤️ До побачення!')
    }
}

const lastArticleHandler = async (ctx: MyContext) => {
    if(!get(ctx.session, 'token')) {
        const [ result ] = shuffle(statusHandlerAnswears)
        return ctx.answerCbQuery(result);
    }
    
    try {
        const article = await parse({ ctx });
        await ctx.reply(article.content)
    } catch(e) {
        console.log(e.message);
        return ctx.answerCbQuery('Сталась помилка');
    }
    return true
}

menu.interact('🔄 Статус', 'status', { do: statusHandler });
menu.interact(ctx => !!ctx.session.token ? '✅ Залоговано' : '🚀 Залогуватися', 'login', { do: loginHandler })
menu.interact('🏁 Розлогуватися', 'logout', { do: logoutHandler });
menu.submenu('📅  Запланувати', 'with-plan', planMenu);
menu.interact('📔 Остання стаття', 'last-article', { do: lastArticleHandler });

menu.manualRow(backButtons);