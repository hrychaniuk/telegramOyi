import { MenuTemplate } from 'telegraf-inline-menu';
import { MyContext } from '@/context';
import { backButtons } from '@/menu/general';
import { logout } from '@/menu/portal'

const menu = new MenuTemplate<MyContext>(_context => {
	return 'Ви впевнені, що готові видалити логін та пароль для логування у порталі?'
});

menu.interact('❗️ Так ❗️', 'apply-delete-creadentials', {
	do: async (context: any) => {
		try {
			await logout(context)
		} catch(e) {} finally {
			context.session.token = ""
			context.session.login = ""
			context.session.password = ""
			context.session.clockify = {}
			context.answerCbQuery('Успішно видалено')
			return true;
		}
    }
})

menu.manualRow(backButtons);

export default menu
