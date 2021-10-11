import { Telegraf } from 'telegraf';
import { MyContext } from '@/context';
import TelegrafI18n from 'telegraf-i18n';
import { MainCommands } from '@/modules/MainCommands'

/** js-modules */
import * as Commands from "@/modules/Commands"
import * as Scenes from "@/modules/Scenes"
import * as Cron from "@/modules/Cron"
import { menuInstance } from "@/modules/Menus"
import { session } from "@/modules/Session"

/** init */
const token = '1328553639:AAErWvqicrGCKQ2M7C9MSgwnOWvRLoqSNu4';
const bot = new Telegraf<MyContext>(token);
const options = { bot }

const i18n = new TelegrafI18n({
	directory: 'locales',
	defaultLanguage: 'uk',
	defaultLanguageOnMissing: true,
	useSession: true
});

bot.use(session.middleware());
bot.use(i18n.middleware());

/** modules */
Scenes.init(options) // must be first
Commands.init(options)
Cron.init(options)

bot.use(menuInstance.middleware());

bot.catch((error: any) => {
	console.error('Telegraf error occured', error);
});

export const startBot = async (): Promise<void> => {
	await bot.telegram.setMyCommands(MainCommands);
	await bot.launch();
	console.log(new Date(), 'Bot started as', bot.options.username);
}
