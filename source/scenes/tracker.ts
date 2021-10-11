import WizardScene from 'telegraf/scenes/wizard'
import { deleteMessages, deleteAfter } from '@/helper'
import axios from 'axios'
import moment from 'moment';
import Extra from 'telegraf/extra';
import Markup from 'telegraf/markup';
import { getMyProjects } from '@/menu/clockify'
import takeRight from 'lodash/takeRight'

type F = {
    name: string
    errorHandler: (...agrs: any[]) => any
}

const DESCR_PREFIX = 'Опис:'
const buttons = {
    EXIST_TASK: '🎯 Вибрати минуле завдання',
    DEV_DESCRIPTION: `${DESCR_PREFIX} Розробка проєкту`,
    TEST_DESCRIPTION: `${DESCR_PREFIX} Тестування проєкту`,
    MEET_DESCRIPTION: `${DESCR_PREFIX} Мітинг по проєкту`,
    NO_DESCRIPTION: 'Без опису',
    GO_BACK: '⬅️ Повернутись назад',
    CANCEL: '🧨 Відміна'
}

const TO_PROJECTS = '⬅️ Повернутись до проєктів'
const EMPTY_PROJECT = '🎲 Без проєкту'

export const trackTaskWithDescr = async ({ ctx, description, projectId }: any = {}) => {
    const { data: { id: taskId } } = await axios.post(`https://global.api.clockify.me/workspaces/${ctx.session.clockify?.workspace}/timeEntries/full`, {
        billable: false,
        customFields: [],
        description,
        projectId,
        start: moment(new Date),
        tagIds: null,
        taskId: null
    }, 
    {
        headers: {
            'x-auth-token': ctx.session.clockify?.token
        }
    })
    return taskId
}

export const getLastTrack = async({ ctx }: any = {}) => {
    const { data } = await axios.get(`https://global.api.clockify.me/workspaces/${ctx.session.clockify?.workspace}/timeEntries/user/${ctx.session.clockify?.uid}/full?page=0&limit=1`,
    {
        headers: {
            'x-auth-token': ctx.session.clockify?.token
        }
    })
    const [ , lastTracker ] = data.timeEntriesList;
    if(lastTracker && !lastTracker?.timeInterval?.end) return lastTracker
    else return null
}

export const getLastTracks = async({ ctx, projectId }: any = {}) => {
    const { data } = await axios.get(`https://global.api.clockify.me/workspaces/${ctx.session.clockify?.workspace}/timeEntries/user/${ctx.session.clockify?.uid}/full?page=0&limit=100`,
    {
        headers: {
            'x-auth-token': ctx.session.clockify?.token
        }
    })
    const result = [] as any[]
    data.timeEntriesList.forEach(({ description, projectId: pid }: any) => {
        description = description?.trim()
        if(description && !result.includes(description) && projectId === pid) {
            result.push(description)
        }
    });
    return result
}

export const stopLastTrack = async({ ctx }: any = {}) => {
    try {
        let lastTracker = await getLastTrack({ ctx });
        
        if(lastTracker) {
            await axios.put(`https://global.api.clockify.me/workspaces/${ctx.session.clockify?.workspace}/timeEntries/${lastTracker.id}/full?stop-timer=true`, {
                billable: false,
                customFields: [],
                description: lastTracker.description,
                projectId: lastTracker.project?.id,
                start: lastTracker.timeInterval.start,
                end: moment(new Date),
                tagIds: null,
                taskId: null
            }, 
            {
                headers: {
                    'x-auth-token': ctx.session.clockify?.token
                }
            })
            return { stoped: true }
        } else {
            return { stoped: false }
        }
    } catch(e) {
        console.log('Stop / ERROR: ', e.message);
        return { stopedError: e.message }
    }
}

export default (_bot: any) => {
    return ({ name, errorHandler }: F) => new WizardScene(
        name,
        errorHandler(async (ctx: any) => {
            try {
                if(!ctx.wizard.state.messages) {
                    ctx.wizard.state.messages = [];
                }
                const data = await getMyProjects(ctx);
                const { message_id } = await ctx.reply('Виберіть проєкт!', Extra.markup(
                    Markup.keyboard([...data.map((item: any) => `${item.name}`), EMPTY_PROJECT, buttons.CANCEL])
                ))
                ctx.wizard.state.messages.push(message_id)                
                return ctx.wizard.next();
            } catch(e) {
                console.log('ERROR_1:', e.message);
                await deleteAfter(ctx.reply('❌ Можливо ваші облікові дані не вірні'), ctx, 3);
                await deleteMessages(ctx, ctx.wizard.state.messages);
                return ctx.scene.leave();
            }
        }),
        errorHandler(async (ctx: any) => {
            /**
             * With cancel option
             */
            if(ctx.message.text === buttons.CANCEL) {
                await deleteAfter(ctx.reply('❎ Відміна!'), ctx, 3);
                await deleteMessages(ctx, ctx.wizard.state.messages);
                return ctx.scene.leave();
            }

            try {
                const data = await getMyProjects(ctx);
                const idProject = data.find((i: any) => i.name === ctx.message.text)?.id;
                ctx.wizard.state.idProject = idProject;

                const isEmptyProject = ctx.message.text === EMPTY_PROJECT;
                
                if(!idProject && !isEmptyProject) {
                    await ctx.reply('‼️‼️ Ви вибрали неіснуючий проєкт. Або продовжуємо створювати завдання без проєкту, або поверніться назад!')
                }

                const { message_id } = await ctx.reply('Введіть опис таски у поле або виберіть запропоновану опцію!', Extra.markup(
                    Markup.keyboard(isEmptyProject ? takeRight(Object.values(buttons), 2) : Object.values(buttons))
                ))
                ctx.wizard.state.messages.push(message_id)
            } catch(e) {
                console.log('ERROR_2:', e.message);
                await deleteMessages(ctx, ctx.wizard.state.messages);
                return ctx.scene.leave();
            }
            return ctx.wizard.next();
        }),
        errorHandler(async (ctx: any) => {
            try {
                /**
                 * No button exist
                 */
                if(ctx.message.text !== buttons.EXIST_TASK) {
                    ctx.wizard.selectStep(3);
                    return ctx.wizard.steps[ctx.wizard.cursor](ctx);
                } else {
                    const tasksList = await getLastTracks({ctx, projectId: ctx.wizard.state.idProject})

                    if(tasksList?.length) {
                        const { message_id } = await ctx.reply('Виберіть завдання, яке, ви трекали раніше!', Extra.markup(
                            Markup.keyboard([...tasksList, TO_PROJECTS, buttons.CANCEL])
                        ))
                        ctx.wizard.state.messages.push(message_id);
                    } else {
                        const { message_id } = await ctx.reply('❎ Не знаходжу завдань за минулі дні по проєкту')
                        ctx.wizard.state.messages.push(message_id);
                        ctx.wizard.selectStep(0);
                        return ctx.wizard.steps[ctx.wizard.cursor](ctx);
                    }    
                }
            } catch(e) {
                await deleteAfter(ctx.reply('❌ Сталась невідома помилка!'), ctx, 3);
                await deleteMessages(ctx, ctx.wizard.state.messages);
                return ctx.scene.leave();
            }
        }),
        errorHandler(async (ctx: any) => {
            try {
                ctx.wizard.state.descProject = ctx.message.text;
                /**
                 * Go back
                 */
                if([buttons.GO_BACK, TO_PROJECTS].includes(ctx.message.text)) {
                    ctx.wizard.selectStep(0);
                    return ctx.wizard.steps[ctx.wizard.cursor](ctx); 
                }
                /**
                 * With selected description
                 */
                if(ctx.message.text.startsWith(DESCR_PREFIX)) {
                    ctx.message.text = ctx.message.text.replace(DESCR_PREFIX, '')
                }
                /**
                 * Empty description
                 */
                if(ctx.message.text === buttons.NO_DESCRIPTION) {
                    ctx.message.text = ''
                }
                /**
                 * With cancel option
                 */
                if(ctx.message.text === buttons.CANCEL) {
                    await deleteAfter(ctx.reply('❎ Відміна!'), ctx, 3);
                    await deleteMessages(ctx, ctx.wizard.state.messages);
                    return ctx.scene.leave();
                }

                /** Tracking logic START */
                const { stoped, stopedError } = await stopLastTrack({ ctx })
                if(stopedError) throw new Error()
                if(stoped) await deleteAfter(ctx.reply('✅ Було зупинене попереднє завдання!'), ctx, 3);
            
                await trackTaskWithDescr({
                    ctx,
                    description: ctx.message.text,
                    projectId: ctx.wizard.state.idProject
                })

                await deleteAfter(ctx.reply('✅ Успішно створенне нове завдання, працюємо далі!'), ctx, 3);
                await deleteMessages(ctx, ctx.wizard.state.messages);
                return ctx.scene.leave();
                /** Tracking logic END */
            } catch(e) {
                await deleteAfter(ctx.reply('❌ Сталась невідома помилка!'), ctx, 3);
                await deleteMessages(ctx, ctx.wizard.state.messages);
                return ctx.scene.leave();
            }
        }),
    );
}