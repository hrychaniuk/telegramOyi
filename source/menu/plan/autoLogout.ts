import { MenuTemplate } from 'telegraf-inline-menu';
import { MyContext } from '@/context';
import { backButtons } from '../general';

const menu = new MenuTemplate<MyContext>(_context => {
	return 'Виберіть годину, о якій відбуватиметься автоматичне вилоговування у порталі.  Дія виконується лише раз, після успішного виконання, значення повернеться у початкове положення. '
});

menu.select('', [
		'No',
		'16:00', 
		'16:30', 
		'17:00', 
		'17:30', 
		'18:00', 
		'18:30',
		'19:00',
		'19:30',
		'20:00',
		'20:30',
		'21:00',
		'21:30',
		'22:00',
		'22:30'
	], {
	isSet: (context, key) => key !== 'No' && context.session.autoLogout === key,
	set: (context, key) => {
		context.session.autoLogout = (key !== 'No' ? key : void 0)
		return true;
	}
});

menu.manualRow(backButtons);

export default menu
