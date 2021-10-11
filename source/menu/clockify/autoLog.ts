import { MenuTemplate } from 'telegraf-inline-menu';
import { MyContext } from '@/context';
import { backButtons } from '../general';

const menu = new MenuTemplate<MyContext>(_context => {
	return 'Виберіть годину, о якій відбуватиметься автоматичне логування у порталі. Дія виконується лише раз, після успішного виконання, значення повернеться у початкове положення. '
});

menu.select('', [
		'No',
		'08:00', 
		'08:30', 
		'09:00', 
		'09:30', 
		'10:00', 
		'10:30',
		'11:00',
		'11:30',
		'12:00'
	], {
	isSet: (context, key) => key !== 'No' && context.session.autoLog === key,
	set: (context, key) => {
		context.session.autoLog = (key !== 'No' ? key : void 0)
		return true;
	}
});

menu.manualRow(backButtons);

export default menu
