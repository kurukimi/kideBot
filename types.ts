export interface TokenDict {
	[key: string]: string
}

export interface Job {
	[key: string]: NodeJS.Timeout
}

export interface JobData {
	date: string;
	jobName: string;
	id: string;
	userId: number;
	token: string

}

export interface JobsByChat {
	[key: string]: Array<JobData>
}

export interface kideResponse {
	model: {
		variants: {
		productVariantMaximumReservableQuantity: number;
		inventoryId: string;
		name: string
		}[]
	}
}