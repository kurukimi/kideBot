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
	chatId: number;
	token: string

}

export interface JobsByChat {
	[key: string]: Array<JobData>
}