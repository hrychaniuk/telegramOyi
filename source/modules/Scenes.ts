import Stage  from 'telegraf/stage';
import portalCreds from '@/scenes/portal-login'
import clockifyCreds from '@/scenes/clockify-login'
import tracker from '@/scenes/tracker'


export const scenes = {
    FORM_SET_USER_CREDENTIALS: 'FORM_SET_USER_CREDENTIALS',
    FORM_SET_CLOCKIFY_CREDENTIALS: 'FORM_SET_CLOCKIFY_CREDENTIALS',
    FORM_TRACKER: 'FORM_TRACKER',
}

const WizardErrorHandle = function(this: any, cb: any) {
	return function(ctx: any) {
		try {
			return cb.call(null, ctx)
		} catch(e) {
			ctx.scene.leave();
            return ctx.reply('Помилка при введенні. Скасування...')
		}
	}
}

export const init = ({ bot }: any) => {

    const clockifyDataWizard = portalCreds(bot)({
        name: scenes.FORM_SET_USER_CREDENTIALS,
        errorHandler: WizardErrorHandle
    })

    const contactDataWizard = clockifyCreds(bot)({
        name: scenes.FORM_SET_CLOCKIFY_CREDENTIALS,
        errorHandler: WizardErrorHandle
    })

    const trackerDataWizard = tracker(bot)({
        name: scenes.FORM_TRACKER,
        errorHandler: WizardErrorHandle
    })

    const stage = new Stage([ contactDataWizard, clockifyDataWizard, trackerDataWizard ]);
    
    bot.use(stage.middleware())
}