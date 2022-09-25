import axios from 'axios';
import crypto from 'crypto';
import {Job, JobsByChat, JobData} from './types'


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
	const dateNow = new Date().getTime();
	
	const id = crypto.randomUUID();
	const obj: JobData = {
	  date: dateSales.toLocaleString('fi-FI', {timeZone: 'Europe/Helsinki'}),
	  jobName: timeData.model.product.name,
			chatId: ctx.chat.id,
			token: token,
			id: id
	};
		jobsByChat[obj.chatId] = [...(jobsByChat[obj.chatId] ? jobsByChat[obj.chatId] : []), obj]
		ctx.reply(`job "${obj.jobName}" scheduled at ${obj.date}`)
	if (dateNow < dateSales.getTime()) {
	  const tOut = setTimeout(requestLoop, (dateSales.getTime() - dateNow), urlSuffix, obj, ctx);
			jobs[id] = tOut;
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
}

const getUrlSuffix = (url: string) => {
	const splitted = url.split('/')
	if (splitted.length < 2) throw 'invalid url'
	return splitted[splitted.length - 1]
}

const getData = async (urlSuffix: string) => {
	const res = await axios.get(
		`https://api.kide.app/api/products/${urlSuffix}`,
		{
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
		}
	);
  return res.data;
}

export const requestLoop = async (urlSuffix: string, obj: JobData, ctx: any) => {
	let success = false;
	let currJobs = jobsByChat[ctx.chat.id]
	ctx.reply(`job "${obj.jobName}" started`)
	setTimeout(() => {
		success = true;
		ctx.reply(`Job ${obj.jobName} stopped, because couldn't get ticket id in 3 minutes`);
		}, 180000)
	while (!success && (currJobs.some(x => x.id === obj.id))) {
		const data = await getData(urlSuffix);
		success = await sendRequest(data, obj, ctx);
		currJobs = jobsByChat[ctx.chat.id]
	}
	if (success) {
		removeJob(obj.id, ctx.chat.id)
	}
	
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

interface kideResponse {
	model: {
		variants: {
		productVariantMaximumReservableQuantity: number;
		inventoryId: string;
		name: string
		}[]
	}
}

const requestJob = async (data: kideResponse, obj: JobData, ctx: any) => {
	const variant = data.model.variants;
  const tryOne: { id: string; name: string; }[] = [];
  if (!variant || variant.length === 0) throw 'no inventory id';
	let message: string[] = []
  await Promise.all(variant.map(async (el) => {
	
	if (el.inventoryId) {
	  const toBuy = el.productVariantMaximumReservableQuantity;
	  const invId = el.inventoryId;
	  const success = await buyTicket(invId, toBuy, obj, ctx);
	  if (success) message.push('Reserved ' + toBuy + 'x: ' + el.name);
	  else tryOne.push({id: invId, name: el.name});
	} else throw 'no inventory id'
	
   
  }));
  await Promise.all(tryOne.map(async (x) => {
	const success = await buyTicket(x.id, 1, obj, ctx);
		if (success) message.push('Reserved 1x ' + x.name)
		else message.push('Couldn\'t buy ' + x.name)
  }));
	ctx.reply(message.join("\n"))
  return true;
}


const buyTicket = async (inventoryId: string, amount: number, obj: JobData, ctx: any) => {
	try {
		const res = await axios.post('https://api.kide.app/api/reservations',
				`{"toCreate":[{"inventoryId":"${inventoryId}","quantity":${amount}}],"toCancel":null}`,
				{
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
				},
		)
		return res.status === 200
	} catch (e) {
			if (axios.isAxiosError(e)) e?.response?.status === 401 && ctx.reply("Request failed. Your token is probably wrong")
			return false
	}
  
}