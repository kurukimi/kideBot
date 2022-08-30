"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegram = void 0;
const telegraf_1 = require("telegraf");
const bot_1 = require("./bot");
const token = process.env.BOT_TOKEN;
exports.telegram = new telegraf_1.Telegram(token);
const bot = new telegraf_1.Telegraf(token);
const tokens = {};
bot.start((ctx) => {
    ctx.reply('Hello ' + ctx.from.first_name + '!');
});
bot.help(async (ctx) => {
    ctx.reply('use /token to set kide tokeni');
    ctx.reply('use /reserve {URL} to create a reserve job');
    ctx.reply('use /jobs to see current and sceduled jobs');
    console.log(tokens);
});
bot.command('token', (ctx) => {
    const user = ctx.message.from.id.toString();
    const token = ctx.message.text.replace('/token', '').trim();
    tokens[user] = token;
    ctx.reply(`token registered`);
});
bot.command('reserve', (ctx) => {
    const user = ctx.message.from.id.toString();
    if (tokens[user]) {
        const url = ctx.message.text.replace('/reserve', '').trim();
        (0, bot_1.createJob)(url, tokens[user], ctx);
    }
    else {
        ctx.reply('No token found! Add a token first');
    }
});
bot.command('jobs', (ctx) => {
    const jobs = (0, bot_1.getJobs)(ctx.chat.id.toString());
    const jobKeys = telegraf_1.Markup.inlineKeyboard(jobs.map(x => telegraf_1.Markup.button.callback(x.jobName + ' ' + x.date, x.id)));
    console.log(jobs);
    (jobs?.length > 0) ?
        ctx.telegram.sendMessage(ctx.chat.id, "Click jobs to delete", jobKeys)
        :
            ctx.reply('Job list empty');
});
bot.action(new RegExp('.*'), (ctx) => {
    console.log(ctx.chat?.id);
    const data = ctx.callbackQuery.data;
    if (data && ctx.chat?.id)
        (0, bot_1.removeJob)(data, ctx.chat?.id);
    const jobs = (0, bot_1.getJobs)(ctx.chat?.id.toString() || "");
    const jobKeys = telegraf_1.Markup.inlineKeyboard(jobs.map(x => telegraf_1.Markup.button.callback(x.jobName + ' ' + x.date, x.id)));
    ctx.editMessageReplyMarkup(jobKeys.reply_markup);
});
bot.launch();
// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
