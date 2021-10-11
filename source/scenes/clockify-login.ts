import WizardScene from 'telegraf/scenes/wizard'
import { deleteMessages, deleteAfter } from '@/helper'
import axios from 'axios'
import Extra from 'telegraf/extra'
import Markup from 'telegraf/markup'

type F = {
    name: string
    errorHandler: (...agrs: any[]) => any
}


export default (_bot: any) => {
    return ({ name, errorHandler }: F) => {
        return new WizardScene(
            name,
            errorHandler(async (ctx: any) => {
                ctx.wizard.state.messages = []
                ctx.wizard.state.errorCount = 0
        
                const { message_id } = await ctx.reply('Введіть пошту до Clockify \n\n 🛑 Застереження: усі дані, що будуть використовуватись для логування, зберігаються в незахищеному вигляді, так як для того, щоб система виконувала рутинну роботу, для неї необхідно користуватись вашими особистими обліковими записами.');
                ctx.wizard.state.messages.push(message_id)
                return ctx.wizard.next();
            }),
            errorHandler(async (ctx: any) => {
                if (!ctx.message.text.includes('@otakoyi')) {
                    ctx.wizard.state.errorCount += 1
                    const { message_id } = await ctx.reply('Це не вірна пошта');
                    ctx.wizard.state.messages.push(message_id)
        
                    if(ctx.wizard.state.errorCount > 2) {
                        await deleteMessages(ctx, ctx.wizard.state.messages, 1);
                        await deleteAfter(ctx.reply('Спробуйте пізніше!'), ctx, 5);
                        return ctx.scene.leave();
                    }
                    return; 
                }
                ctx.wizard.state.login = ctx.message.text;
                const { message_id } = await ctx.reply('Введіть пароль до Clockify \n\n 🛑 Застереження: усі дані, що будуть використовуватись для логування, зберігаються в незахищеному вигляді, так як для того, щоб система виконувала рутинну роботу, для неї необхідно користуватись вашими особистими обліковими записами.');
                ctx.wizard.state.messages.push(message_id)
                return ctx.wizard.next();
            }),
            errorHandler(async (ctx: any) => {
                try {
                    const { data: { token, id: uid } } = await axios.post('https://global.api.clockify.me/auth/token', {
                        email: ctx.wizard.state.login,
                        password: ctx.message.text
                    })
                    const { data } = await axios.get('https://global.api.clockify.me/workspaces/', {
                        headers: {
                            'x-auth-token': token
                        }
                    })
                    ctx.wizard.state.result = data.map(({name, id}: any) => ({name, id}));
                    ctx.wizard.state.uid = uid;
                    ctx.wizard.state.password = ctx.message.text;
                } catch(e) {
                    ctx.wizard.state.errorCount += 1
                    const { message_id } = await ctx.reply('Це не вірний пароль');
                    ctx.wizard.state.messages.push(message_id)
                    if(ctx.wizard.state.errorCount > 2) {
                        await deleteMessages(ctx, ctx.wizard.state.messages, 1);
                        await deleteAfter(ctx.reply('Спробуйте пізніше!'), ctx, 5);
                        return ctx.scene.leave();
                    }
                    return; 
                }

                const { message_id } = await ctx.reply('Виберіть workspace!', Extra.markup(
                    Markup.keyboard(ctx.wizard.state.result.map((item: any) => item.name))
                  ));
                ctx.wizard.state.messages.push(message_id)
                await ctx.wizard.next();  
            }),
            errorHandler(async (ctx: any) => {
                if(!ctx.session.clockify) ctx.session.clockify = {};
                /** */
                const { id: workspaceId } = ctx.wizard.state.result?.find((i: any) => i.name === ctx.message.text) || {}

                if(!workspaceId) {
                    await deleteMessages(ctx, ctx.wizard.state.messages);
                    await deleteAfter(ctx.reply('Спробуйте пізніше!'), ctx, 5);
                    return ctx.scene.leave();
                }
                
                ctx.session.clockify.uid = ctx.wizard.state.uid;
                ctx.session.clockify.login = ctx.wizard.state.login;
                ctx.session.clockify.password = ctx.wizard.state.password;
                ctx.session.clockify.workspace = workspaceId;
                ctx.session.clockify.workspaceName = ctx.message.text;
                
                await deleteAfter(ctx.reply('Ваші дані оновлені! Тепер ви можете користуватись розділом Clockify.'), ctx, 5);
                await deleteMessages(ctx, ctx.wizard.state.messages);
        
                return ctx.scene.leave();
            }),
        );
    }
}