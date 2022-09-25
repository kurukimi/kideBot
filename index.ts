
import { Markup, Telegraf, Telegram } from 'telegraf';
import { createJob, getJobs, removeJob} from './bot';
import { TokenDict } from './types'
import { db } from './elephantDb'


const token: string = process.env.BOT_TOKEN as string;
const allowed: Array<Number> = [1319284792, 2080770254]


export const telegram: Telegram = new Telegram(token);

const bot = new Telegraf(token);


const tokens: TokenDict = {}

bot.use(async (ctx, next) => {
	const userId = ctx.from?.id
	console.log(userId)
	if (userId) {
		const { rows } = await db.query('SELECT id FROM users WHERE id = $1', [userId.toString()])
		console.log(rows)
		rows.length > 0 ? await next() : ctx.reply('User not allowed.')
	}
})

bot.start((ctx) => {
	ctx.reply('Hello ' + ctx.from.first_name + '!');
});

bot.help( async (ctx) => {
	ctx.reply('use /token to set kide tokeni');
	ctx.reply('use /reserve {URL} to create a reserve job');
	ctx.reply('use /jobs to see current and sceduled jobs')
});

bot.command('token', async (ctx) => {
	const user = ctx.message.from.id.toString()
	const token = ctx.message.text.replace('/token', '').trim()
	try {
		await db.query('UPDATE users SET token = $1 WHERE id = $2', [token, user])
		ctx.reply(`token registered`);
	} catch (e) {
		console.log(e)
		ctx.reply(`Couldn't register token`);
	}
});

bot.command('reserve', async (ctx) => {
	const user = ctx.message.from.id.toString()
	const { rows } = await db.query('SELECT token FROM users WHERE id = $1', [user])
	if (rows.length > 0 && rows[0].token) {
		const url = ctx.message.text.replace('/reserve', '').trim()
		createJob(url, rows[0].token, ctx)
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