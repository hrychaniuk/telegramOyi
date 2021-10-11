// @ts-nocheck

import moment from 'moment';
import sleep from 'await-sleep';
import axios from 'axios';
import get from 'lodash/get';
import schedule from 'node-schedule';
import htmlToText from 'html-to-text';
import { getUsers, db } from './Session';
import { login, logout } from '@/menu/portal';

const getTime = () => moment(new Date).format('HH:mm')

function daysUntil(date) {
    const birthday = moment(date, ['YYYY-MM-DD']);
    const today = moment().format("YYYY-MM-DD");
    const age = moment(today).diff(birthday, 'years');
    
    moment(age).format("YYYY-MM-DD");
    
    let nextBirthday = moment(birthday).add(age, 'years');
    moment(nextBirthday).format("YYYY-MM-DD");
    const isToday = nextBirthday.isSame(today)
    
    nextBirthday = moment(birthday).add(age + 1, 'years');
    return { ageDid: age, ageWill: age + 1, days: isToday ? 0 : nextBirthday.diff(today, 'days') }
  }

const blogMapper = ({ id, name, content }: any) => ({
    id, 
    name, 
    content: htmlToText.fromString(content, { wordwrap: 500 }) 
})

const coworkerMapper = (levels: any = {}) => {
    const users = [];
    outer: for(let enlishLevel of levels) {
        for(let user of (enlishLevel.users || [])) {
            users.push({
                id: user.id,
                name: user.name,
                surname: user.surname,
                birthday: user.birthday
            })
        }
    }
    return users
}

export const init = ({ bot }: any) => {
    console.log('Time is:', getTime());

     /** ============================
     * COWORKER BIRTHDAY NOTIFICATION 
     */
    schedule.scheduleJob('0 8 * * *', async () => {
        const users = getUsers()
        const cws = db.get('coworkers').filter(i => [0/*, 1*/, 7].includes(daysUntil(i.birthday).days)).value();
        if(!cws.length) return;

        outer: for(let user of users) {
            if(
                user.disableNotifyBirthday 
                /** guess, that isnot important */
                // || (user.lastSession && moment().diff(moment(user.lastSession), "days") > 7)
            ) continue;

            try {
                for(let coworker of cws) {
                    switch(daysUntil(coworker.birthday).days) {
                        case 7:
                            await bot.telegram.sendMessage(user.id, 
                                `🌸 Через тиждень святкує день народження ${coworker.name} ${coworker.surname}`)
                            break
                        // case 1:
                        //     await bot.telegram.sendMessage(user.id, 
                        //         `💛 Незабуваємо завтра привітати ${coworker.name} ${coworker.surname}!`)
                        //     break
                        case 0:
                            await bot.telegram.sendMessage(user.id, 
                                `💐🌺🌹🐣 Сьогодні святкує день народження ${coworker.name} ${coworker.surname}`)
                            break
                    }
                }
            } catch(e) {
                continue
            }
        }
    })

    /** ==============================
     * USER NOTIFICATION WITH NEW POST
     */
    const notifyAllUserWithNewPost = async () => {
        const users = getUsers();
        const articleContent = db.get('posts.[0].content').value()
        
        outer: for(let user of users) {
            if(
                user.disableNotifyBlog ||
                (user.lastSession && moment().diff(moment(user.lastSession), "days") > 7)
            ) continue; 

            try {
                await bot.telegram.sendMessage(user.id, `🔥🔥🔥 У нас нова стаття! \n \n ${articleContent}`)
            } catch(e) {
                continue
            }
        }
    }
    
    /** ============
     * GET LAST POST
     */
    schedule.scheduleJob('*/2 7-21 * * 1-5', async () => {
        const users = getUsers();
        const prevBlogId = db.get('posts.[0].id').value();

        outer: for(let user of users) {
            try {
                if(!user.token) continue

                const { data } = await axios.get('https://api.portal.otakoyi.com/api/v1/blog', {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                })
                const [ article ] = data.data;
            
                db.unset('posts').write()
                db.set('posts', [ article ].map(blogMapper) )
                  .write()

                /** notification */
                if(article.id !== prevBlogId) await notifyAllUserWithNewPost()
                break outer
            } catch(e) {
                console.log('no_valid');
                continue
            }
        }
    })

    /** ====================
     * GET COWORKER BITHDAYS
     */
    schedule.scheduleJob('0 12,19 * * 1-5', async () => {
        const users = getUsers()
        outer: for(let user of users) {
            try {
                if(!user.token) continue

                const { data } = await axios.get('https://api.portal.otakoyi.com/api/v1/ep-level', {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                })
                
                db.unset('coworkers').write()
                db.set('coworkers', coworkerMapper(data.data)).write();
                break outer
            } catch(e) {
                continue
            }
        }
    })

    /** ===================
     * AUTO HANDLER IN PORTAL
     */
    schedule.scheduleJob('*/10 7-23 * * 1-5', async () => {
        const users = getUsers()
        for(let user of users) {
            try {
                if(user.autoLog === getTime()) {
                    const { data } = await login({ session: user })
                    db.get('sessions').find(u => u.id === user.id)
                        .set('data.token', data.token)
                        .set('data.lastSession', + new Date())
                        .set('data.autoLog', null).write();
                        
                    await bot.telegram.sendMessage(user.id, '✅ Ви успішно залоговані у портал, оновіть статус щоб переконатись: ' + getTime())
                } 
                if(user.autoLogout === getTime()) {
                    try {
                        /** login, after that -> logout */
                        const { data } = await login({ session: user });
                        await sleep(1000);
                        await logout({ session: { token: data.token } });
                        db.get('sessions').find(u => u.id === user.id)
                            .set('data.token', '')
                            .set('data.lastSession', + new Date())
                            .set('data.autoLogout', null).write();

                        await bot.telegram.sendMessage(user.id, '✅ Ви успішно розлоговані з порталу, оновіть статус щоб переконатись: ' + getTime())
                    } catch(e) {}
                }
            } catch(e) {
                await bot.telegram.sendMessage(user.id, '❌ Сталася помилка при автоматичному логуванні / розлогуванні на порталі: ' + getTime())
            }
        }
    })
}