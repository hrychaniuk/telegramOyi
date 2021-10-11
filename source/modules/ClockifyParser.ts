// @ts-nocheck
import get from 'lodash/get'
import axios from 'axios'
import { browser } from '@/browser'

export const parse = async ({ ctx }: any) => {
    let page;
    let buffer;
    browser = await browser

    try {
        page = await browser.newPage();
        page.setViewport({ width: 1300, height: 800, deviceScaleFactor: 1 });
        await page.goto('https://clockify.me/tracker', { timeout: 10000 } );

        const ls = await page.evaluate(({ email, token, activeWorkspace, id }) => {
            localStorage['token'] = token;
            localStorage['user'] = JSON.stringify({ id, activeWorkspace });
        }, {
            token: ctx.session.clockify?.token,
            activeWorkspace: ctx.session.clockify?.workspace,
            id: ctx.session.clockify?.uid,
        });
        
        await page.waitForSelector('.cl-tracker-entries-wrapper approval-header + .cl-card', { timeout: 10000 });
        await page.evaluate(() => {
            document.querySelector('sidebar-and-topbar').remove()
            document.querySelector('time-tracker-recorder').remove()            
        });
        
        const element = await page.$('.cl-tracker-entries-wrapper approval-header + .cl-card');
        buffer = await element.screenshot();
    } catch(e) {
        console.log('err_name: ', e.message);
        throw e;
    } finally {
        console.log('browser_close');
        await page.close();
    }

    return buffer
}
