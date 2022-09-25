"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegram = void 0;
const telegraf_1 = require("telegraf");
const bot_1 = require("./bot");
const elephantDb_1 = require("./elephantDb");
const token = process.env.BOT_TOKEN;
const allowed = [1319284792, 2080770254];
exports.telegram = new telegraf_1.Telegram(token);
const bot = new telegraf_1.Telegraf(token);
const tokens = {};
bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    console.log(userId);
    if (userId) {
        const { rows } = await elephantDb_1.db.query('SELECT id FROM users WHERE id = $1', [userId.toString()]);
        console.log(rows);
        rows.length > 0 ? await next() : ctx.reply('User not allowed.');
    }
});
bot.start((ctx) => {
    ctx.reply('Hello ' + ctx.from.first_name + '!');
});
bot.help(async (ctx) => {
    ctx.reply('use /token to set kide tokeni');
    ctx.reply('use /reserve {URL} to create a reserve job');
    ctx.reply('use /jobs to see current and sceduled jobs');
});
bot.command('token', async (ctx) => {
    const user = ctx.message.from.id.toString();
    const token = ctx.message.text.replace('/token', '').trim();
    try {
        await elephantDb_1.db.query('UPDATE users SET token = $1 WHERE id = $2', [token, user]);
        ctx.reply(`token registered`);
    }
    catch (e) {
        console.log(e);
        ctx.reply(`Couldn't register token`);
    }
});
bot.command('reserve', async (ctx) => {
    const user = ctx.message.from.id.toString();
    const { rows } = await elephantDb_1.db.query('SELECT token FROM users WHERE id = $1', [user]);
    if (rows.length > 0 && rows[0].token) {
        const url = ctx.message.text.replace('/reserve', '').trim();
        (0, bot_1.createJob)(url, rows[0].token, ctx);
    }
    else {
        ctx.reply('No token found! Add a token first');
    }
});
bot.command('jobs', (ctx) => {
    const jobs = (0, bot_1.getJobs)(ctx.chat.id.toString());
    console.log(jobs);
    (jobs?.length > 0) ?
        ctx.telegram.sendMessage(ctx.chat.id, "Click jobs to delete", telegraf_1.Markup.inlineKeyboard(jobs.map(x => telegraf_1.Markup.button.callback(x.jobName + ' ' + x.date, x.id))))
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
