
import { Context, Markup, Telegraf, Telegram } from 'telegraf';
import { createJob, getJobs, removeJob} from './bot';
import {TokenDict} from './types'

const token: string = process.env.BOT_TOKEN as string;
const allowed: Array<Number> = [1319284792, 2080770254]


export const telegram: Telegram = new Telegram(token);

const bot = new Telegraf(token);


const tokens: TokenDict = {}

bot.use(async (ctx, next) => {
	const userId = ctx.message?.from.id
	console.log(userId)
	if (userId && allowed.includes(userId)) {
		await next()
	} else {
		ctx.reply('User not allowed.')
	}
})

bot.start((ctx) => {
	ctx.reply('Hello ' + ctx.from.first_name + '!');
});

bot.help( async (ctx) => {
	ctx.reply('use /token to set kide tokeni');
	ctx.reply('use /reserve {URL} to create a reserve job');
	ctx.reply('use /jobs to see current and sceduled jobs')
	console.log(tokens)

});

bot.command('token', (ctx) => {
	const user = ctx.message.from.id.toString()
	const token = ctx.message.text.replace('/token', '').trim()
	tokens[user] = token
	ctx.reply(`token registered`);
});

bot.command('reserve', (ctx) => {
	const user = ctx.message.from.id.toString()
	if (tokens[user]) {
		const url = ctx.message.text.replace('/reserve', '').trim()
		createJob(url, tokens[user], ctx)
	} else {
		ctx.reply('No token found! Add a token first')
	}
	
});


bot.command('jobs', (ctx) => {
	const jobs = getJobs(ctx.chat.id.toString());
	console.log(jobs);
	(jobs?.length > 0) ?
	ctx.telegram.sendMessage(ctx.chat.id, "Click jobs to delete",  Markup.inlineKeyboard(
		jobs.map(x => Markup.button.callback(x.jobName + ' ' + x.date, x.id))
	))
	:
	ctx.reply('Job list empty')
});

bot.action(new RegExp('.*'), (ctx) => {
	console.log(ctx.chat?.id)
	const data = ctx.callbackQuery.data
	if (data && ctx.chat?.id) removeJob(data, ctx.chat?.id)
	const jobs = getJobs(ctx.chat?.id.toString() || "");
	const jobKeys = Markup.inlineKeyboard(
		jobs.map(x => Markup.button.callback(x.jobName + ' ' + x.date, x.id))
	)
	ctx.editMessageReplyMarkup(jobKeys.reply_markup)
});


bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));