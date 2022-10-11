import axios from 'axios'
import { JobData } from './types'

export const buyRequest = (inventoryId: string, amount: number, obj: JobData) => {
	return axios.post('https://api.kide.app/api/reservations',
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
}

export const dataRequest = async (urlSuffix: string) => {
	return await axios.get(
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
}