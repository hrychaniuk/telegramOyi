import { menuInstance } from './Menus'

export const init = ({ bot }: any) => {
    bot.command('start', async (context: any) => {
        menuInstance.replyToContext(context)
    })

    bot.command('help', async (context: any) => {
        await context.replyWithMarkdown(`👋 Йоу, *${context.from?.first_name}*! Файне рішення для трекінгу часу та отримання сповіщень на порталі *OTAKOYI*. Налаштування сповіщень та облікових записів - /settings \n\nБот з можливістю автоматизації та зручною роботою з порталом OYI та Clockify.`)
    })
    
    bot.command('settings', async (context: any) => menuInstance.replyToContext(context, '/settings/'));
}