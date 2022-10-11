import axios from 'axios';
import crypto from 'crypto';
import {Job, JobsByChat, JobData, kideResponse} from './types';
import { buyRequest, dataRequest } from './requests';


const jobs: Job = {}
const jobsByChat: JobsByChat = {}

export const getJobs = (chatId: string) => {
	return jobsByChat[chatId] || null
}

export const createJob = async (url: string, token: string, ctx: any) => {
	try {
		const urlSuffix = getUrlSuffix(url)
		const timeData = await getData(urlSuffix);
		const time = timeData.model.product.dateSalesFrom;
		const dateSales = new Date(time);
		const id = crypto.randomUUID();
		const obj: JobData = {
				date: dateSales.toLocaleString('fi-FI', {timeZone: 'Europe/Helsinki'}),
				jobName: timeData.model.product.name,
				userId: ctx.user.id,
				token: token,
				id: id
		};
		jobsByChat[obj.userId] = [...(jobsByChat[obj.userId] ? jobsByChat[obj.userId] : []), obj]
		const dateNow = new Date().getTime();
		if (dateNow < dateSales.getTime()) {
			const tOut = setTimeout(requestLoop, (dateSales.getTime() - dateNow), urlSuffix, obj, ctx);
			jobs[id] = tOut;
			ctx.reply(`job "${obj.jobName}" scheduled at ${obj.date}`)
		} else {
			requestLoop(urlSuffix, obj, ctx);
		}
  } catch (err) {
		console.log(err)
		console.log('invalid url');
  }
}

export const removeJob = (id: string, chatId: number) => {
	jobsByChat[chatId] = jobsByChat[chatId].filter(x => x.id !== id)
	clearTimeout(jobs[id]);
	delete jobs[id]
	console.log(jobsByChat)
}

const getUrlSuffix = (url: string) => {
	const splitted = url.split('/')
	if (splitted.length < 2) throw 'invalid url'
	return splitted[splitted.length - 1]
}

const getData = async (urlSuffix: string) => {
	const res = await dataRequest(urlSuffix)
  return res.data;
}

export const requestLoop = async (urlSuffix: string, obj: JobData, ctx: any) => {
	let success = false;
	let timedOut = false
	ctx.reply(`job "${obj.jobName}" started`)
	const jobTimeout = setTimeout(() => {
		timedOut = true;
		ctx.reply(`Job ${obj.jobName} stopped, because couldn't get ticket id in 2 minutes`);
		}, 120000)
	while (!timedOut && !success && (jobsByChat[ctx.chat.id].some(x => x.id === obj.id))) {
		const data = await getData(urlSuffix);
		success = await sendRequest(data, obj, ctx);
	}
	if (success || timedOut) {
		removeJob(obj.id, ctx.chat.id)
	} 
	clearTimeout(jobTimeout)
	
}


const sendRequest = async (data: kideResponse, obj: JobData, ctx: any) => {
	try {
		return await requestJob(data, obj, ctx);
  } catch (e) {
		console.log(e as Error);
		await new Promise((resolve) => setTimeout(resolve, 500))
		return false
  }
}



const requestJob = async (data: kideResponse, obj: JobData, ctx: any) => {
	const variant = data.model.variants;
	if (!variant || variant.length === 0) throw 'no inventory id';
	let message: string[] = []
	// for looppi ?
	// lähetä ensin yks
	await Promise.all(variant.map(async (el) => {
		if (el.inventoryId) {
			const toBuy = el.productVariantMaximumReservableQuantity;
			const invId = el.inventoryId;
			console.log("ticket")
			const success = await buyTicket(invId, toBuy, obj, ctx);
			if (success != 0) message.push('Reserved ' + toBuy + 'x: ' + el.name);
			else message.push('Couldn\'t buy ' + el.name)
		}
		else throw 'no inventory id'
	}));
	
	ctx.reply(message.join("\n"))
	return true;
}


const buyTicket = async (invId: string, amount: number, obj: JobData, ctx: any) => {
	try {
		const [resOne, resAmount] = await Promise.all([buyRequest(invId, 1, obj), buyRequest(invId, amount, obj)])
		if (resAmount.status === 200) return amount
		else if (resOne.status === 200) return 1
		else return 0
	} catch (e) {
			if (axios.isAxiosError(e)) e?.response?.status === 401 && ctx.reply("Request failed. Your token is probably wrong")
			return 0
	}
  
}