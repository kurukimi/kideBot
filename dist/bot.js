"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLoop = exports.removeJob = exports.createJob = exports.getJobs = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const jobs = {};
const jobsByChat = {};
const getJobs = (chatId) => {
    return jobsByChat[chatId] || null;
};
exports.getJobs = getJobs;
const createJob = async (url, token, ctx) => {
    try {
        const urlSuffix = getUrlSuffix(url);
        const timeData = await getData(urlSuffix);
        const time = timeData.model.product.dateSalesFrom;
        const dateSales = new Date(time);
        const dateNow = new Date().getTime();
        const id = crypto_1.default.randomUUID();
        const obj = {
            date: dateSales.toLocaleDateString(),
            time: `${dateSales.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            jobName: timeData.model.product.name,
            chatId: ctx.chat.id,
            token: token,
            id: id
        };
        jobsByChat[obj.chatId] = [...(jobsByChat[obj.chatId] ? jobsByChat[obj.chatId] : []), obj];
        ctx.reply(`job "${obj.jobName}" scheduled at ${obj.date} ${obj.time}`);
        if (dateNow < dateSales.getTime()) {
            const tOut = setTimeout(exports.requestLoop, (dateSales.getTime() - dateNow), urlSuffix, obj, ctx);
            jobs[id] = tOut;
        }
        else {
            (0, exports.requestLoop)(urlSuffix, obj, ctx);
        }
    }
    catch (err) {
        console.log(err);
        console.log('invalid url');
    }
};
exports.createJob = createJob;
const removeJob = (id, chatId) => {
    jobsByChat[chatId] = jobsByChat[chatId].filter(x => x.id !== id);
    clearTimeout(jobs[id]);
    delete jobs[id];
};
exports.removeJob = removeJob;
const getUrlSuffix = (url) => {
    const splitted = url.split('/');
    if (splitted.length < 2)
        throw 'invalid url';
    return splitted[splitted.length - 1];
};
const getData = async (urlSuffix) => {
    const res = await axios_1.default.get(`https://api.kide.app/api/products/${urlSuffix}`, {
        headers: {
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'accept-language': 'fi-FI,fi;q=0.9,sv;q=0.8,en;q=0.7',
            'cache-control': 'max-age=0',
            'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="99", "Google Chrome";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'none',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1',
        },
    });
    return res.data;
};
const requestLoop = async (urlSuffix, obj, ctx) => {
    let success = false;
    let currJobs = jobsByChat[ctx.chat.id];
    ctx.reply(`job "${obj.jobName}" started`);
    while (!success && (currJobs.some(x => x.id === obj.id))) {
        const data = await getData(urlSuffix);
        success = await sendRequest(data, obj, ctx);
        currJobs = jobsByChat[ctx.chat.id];
    }
    if (success) {
        (0, exports.removeJob)(obj.id, ctx.chat.id);
    }
};
exports.requestLoop = requestLoop;
const sendRequest = async (data, obj, ctx) => {
    try {
        return await requestJob(data, obj, ctx);
    }
    catch (e) {
        console.log(e);
        await new Promise((resolve) => setTimeout(resolve, 500));
        return false;
    }
};
const requestJob = async (data, obj, ctx) => {
    const variant = data.model.variants;
    const tryOne = [];
    if (!variant || variant.length === 0)
        throw 'no inventory id';
    let message = [];
    await Promise.all(variant.map(async (el) => {
        if (el.inventoryId) {
            const toBuy = el.productVariantMaximumReservableQuantity;
            const invId = el.inventoryId;
            const success = await buyTicket(invId, toBuy, obj, ctx);
            if (success)
                message.push('Reserved ' + toBuy + 'x: ' + el.name);
            else
                tryOne.push({ id: invId, name: el.name });
        }
        else
            throw 'no inventory id';
    }));
    await Promise.all(tryOne.map(async (x) => {
        const success = await buyTicket(x.id, 1, obj, ctx);
        if (success)
            message.push('Reserved 1x ' + x.name);
        else
            message.push('Couldn\'t buy ' + x.name);
    }));
    ctx.reply(message.join("\n"));
    return true;
};
const buyTicket = async (inventoryId, amount, obj, ctx) => {
    try {
        const res = await axios_1.default.post('https://api.kide.app/api/reservations', `{"toCreate":[{"inventoryId":"${inventoryId}","quantity":${amount}}],"toCancel":null}`, {
            'headers': {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'fi-FI,fi;q=0.9,sv;q=0.8,en;q=0.7',
                'authorization': `Bearer ${obj.token}`,
                'content-type': 'application/json;charset=UTF-8',
                'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="99", "Google Chrome";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'x-requested-with': 'XMLHttpRequest',
                'Referer': 'https://kide.app/',
                'Referrer-Policy': 'strict-origin-when-cross-origin',
            },
        });
        return res.status === 200;
    }
    catch (e) {
        if (axios_1.default.isAxiosError(e))
            e?.response?.status === 401 && ctx.reply("Request failed. Your token is probably wrong");
        return false;
    }
};
