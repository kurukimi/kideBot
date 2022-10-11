"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyRequest = void 0;
const axios_1 = __importDefault(require("axios"));
const buyRequest = (inventoryId, amount, obj) => {
    return axios_1.default.post('https://api.kide.app/api/reservations', `{"toCreate":[{"inventoryId":"${inventoryId}","quantity":${amount}}],"toCancel":null}`, {
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
    });
};
exports.buyRequest = buyRequest;
