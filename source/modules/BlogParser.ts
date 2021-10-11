// @ts-nocheck
import get from 'lodash/get'
import sleep from 'await-sleep';
import axios from 'axios'
import htmlToText from 'html-to-text';

export const parse = async ({ ctx }: any) => {
    let buffer;
    const jwt = get(ctx.session, 'token');
    const { data } = await axios.get('https://api.portal.otakoyi.com/api/v1/blog', {
        headers: {
            Authorization: `Bearer ${jwt}`
        }
    })

    const [ article ] = data.data;
    const { id, name, content } = article;
    const pageUrl = `https://portal.otakoyi.com/blog/${id}`;

    return { 
        id, 
        name, 
        content: htmlToText.fromString(content, { wordwrap: 500 }) 
    }

    // TODO this screenshot

    const puppeteer = require('puppeteer');

    try {
        const browser = await puppeteer.launch({args: ['--no-sandbox']});
        const page = await browser.newPage();

        page.setViewport({ width: 1800, height: 800, deviceScaleFactor: 1 });
        await page.goto(pageUrl, { timeout: 20000 } );
        const ls = await page.evaluate((token) => {
            localStorage['jwtToken-2020-09-30'] = token;
            return localStorage['jwtToken-2020-09-30']
        }, jwt);
        console.log('last_token: ', ls);
        
        await page.goto(pageUrl, { timeout: 20000 } );

        await page.waitForSelector('.blog-content', { timeout: 20000 });
        await page.evaluate(() => { 
            document.querySelector('.blog-content').style.padding = '60px';
            document.querySelector('.blog-image')?.remove()
            document.querySelector('.big-like-wrap')?.remove()
            document.querySelector('.main-wrapper > .header')?.remove()
        });
        
        const element = await page.$('.blog-content');
        buffer = await element.screenshot(/*{ path: 'google.png' }*/);
        await browser.close();
    } catch(e) {
        console.log('err_name: ', e.name);
        throw e;
    }

    return buffer;
}
