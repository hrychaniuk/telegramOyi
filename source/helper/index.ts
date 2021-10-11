import atob from 'atob'

export const parseJwt = function(token: any) {
    try {
        if(!token) return "";
    
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c: any) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        return JSON.parse(jsonPayload);
    } catch(e) {
        console.error(e.message);
        return ""
    }
};

export const deleteAfter = async (replyPromise: any, ctx: any, delay: number = 1) => {
    const { message_id } = await replyPromise;

    if(delay === 0) await ctx.deleteMessage(message_id)
    else {
        setTimeout(async () => {
            try {
                await ctx.deleteMessage(message_id)
            } catch(e) {}
        }, delay * 1000)
    }
}

export const isSetCredentials = (ctx: any): boolean => {
	return ctx.session.login && ctx.session.password
}

export const deleteMessages = async (ctx: any, msgs: any[], plus: number = 2) => {
    if(!msgs?.length) return;

	const all_messages = Array.from(
		Array(msgs[msgs.length - 1] - msgs[0] + plus).keys()
	).map(i => i + msgs[0])

	for(let id of all_messages) {
		try {
			await ctx.deleteMessage(id)
		} catch(e) {}
	}
}