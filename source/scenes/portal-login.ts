import WizardScene from 'telegraf/scenes/wizard'
import { deleteMessages, deleteAfter } from '@/helper'

type F = {
    name: string
    errorHandler: (...agrs: any[]) => any
}

export default (_bot: any) => {
    return ({ name, errorHandler }: F) => new WizardScene(
        name,
        errorHandler(async (ctx: any) => {
            ctx.wizard.state.messages = []
            ctx.wizard.state.errorCount = 0
            const { message_id } = await ctx.reply('Введіть пошту до порталу OYI \n\n 🛑 Застереження: усі дані, що будуть використовуватись для логування, зберігаються в незахищеному вигляді, так як для того, щоб система виконувала рутинну роботу, для неї необхідно користуватись вашими особистими обліковими записами.');
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
            const { message_id } = await ctx.reply('Введіть пароль до порталу OYI \n\n 🛑 Застереження: усі дані, що будуть використовуватись для логування, зберігаються в незахищеному вигляді, так як для того, щоб система виконувала рутинну роботу, для неї необхідно користуватись вашими особистими обліковими записами.');
            ctx.wizard.state.messages.push(message_id)
            return ctx.wizard.next();
        }),
        errorHandler(async (ctx: any) => {
            ctx.wizard.state.password = ctx.message.text;
            /** */
            ctx.session.login = ctx.wizard.state.login;
            ctx.session.password = ctx.wizard.state.password;
            
            await deleteAfter(ctx.reply('Ваші дані оновлені! Тепер ви можете зайти у головне меню та залогуватись у портал.'), ctx, 5);
            await deleteMessages(ctx, ctx.wizard.state.messages);
    
            return ctx.scene.leave();
        }),
    );
}