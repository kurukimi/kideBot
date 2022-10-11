"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLoop = exports.removeJob = exports.createJob = exports.getJobs = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const requests_1 = require("./requests");
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
            date: dateSales.toLocaleString('fi-FI', { timeZone: 'Europe/Helsinki' }),
            jobName: timeData.model.product.name,
            chatId: ctx.chat.id,
            token: token,
            id: id
        };
        jobsByChat[obj.chatId] = [...(jobsByChat[obj.chatId] ? jobsByChat[obj.chatId] : []), obj];
        if (dateNow < dateSales.getTime()) {
            const tOut = setTimeout(exports.requestLoop, (dateSales.getTime() - dateNow), urlSuffix, obj, ctx);
            jobs[id] = tOut;
            ctx.reply(`job "${obj.jobName}" scheduled at ${obj.date}`);
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
    console.log(jobsByChat);
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
    let timedOut = false;
    ctx.reply(`job "${obj.jobName}" started`);
    const jobTimeout = setTimeout(() => {
        timedOut = true;
        ctx.reply(`Job ${obj.jobName} stopped, because couldn't get ticket id in 2 minutes`);
    }, 120000);
    while (!timedOut && !success && (jobsByChat[ctx.chat.id].some(x => x.id === obj.id))) {
        const data = await getData(urlSuffix);
        success = await sendRequest(data, obj, ctx);
    }
    if (success || timedOut) {
        (0, exports.removeJob)(obj.id, ctx.chat.id);
    }
    clearTimeout(jobTimeout);
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
    if (!variant || variant.length === 0)
        throw 'no inventory id';
    let message = [];
    // for looppi ?
    // lähetä ensin yks
    await Promise.all(variant.map(async (el) => {
        if (el.inventoryId) {
            const toBuy = el.productVariantMaximumReservableQuantity;
            const invId = el.inventoryId;
            console.log("ticket");
            const success = await buyTicket(invId, toBuy, obj, ctx);
            if (success != 0)
                message.push('Reserved ' + toBuy + 'x: ' + el.name);
            else
                message.push('Couldn\'t buy ' + el.name);
        }
        else
            throw 'no inventory id';
    }));
    ctx.reply(message.join("\n"));
    return true;
};
const buyTicket = async (invId, amount, obj, ctx) => {
    try {
        const [resOne, resAmount] = await Promise.all([(0, requests_1.buyRequest)(invId, 1, obj), (0, requests_1.buyRequest)(invId, amount, obj)]);
        if (resAmount.status === 200)
            return amount;
        else if (resOne.status === 200)
            return 1;
        else
            return 0;
    }
    catch (e) {
        if (axios_1.default.isAxiosError(e))
            e?.response?.status === 401 && ctx.reply("Request failed. Your token is probably wrong");
        return 0;
    }
};
