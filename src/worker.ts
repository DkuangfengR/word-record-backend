/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Router, cors } from 'itty-router';
import { login, withToken } from './utils';
import { listColors, addColor, updateColor, deleteColor, listKeyword, addKeyword, updateGroupId, deleteKeywords, deleteKeyword, updateRemark, getKeywordById, listCategory, addCategory, deleteCategory, download, doDownload, setColor } from './handlers';

// cors
const { preflight, corsify } = cors({
	origin: (origin) => origin || '*', // 必须指定具体的 origin
	credentials: true, // 允许发送凭证（如 Cookies、Authorization headers）
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

// Create a new router
const router = Router({
	before: [preflight],  // add preflight upstream
	finally: [corsify],   // and corsify downstream
});

router.get('/manage/login', login).post('/manage/download', withToken, download).get('/manage/download', doDownload)
	.get('/manage/color/list', listColors).post("/manage/color/add", withToken, addColor).put("/manage/color/setColor", withToken, setColor)
	.put("/manage/color/update", withToken, updateColor).delete("/manage/color/:id", withToken, deleteColor)
	.get("/manage/keyword/list", withToken, listKeyword).post("/manage/keyword/add", addKeyword)
	.put("/manage/keyword/put", withToken, updateGroupId).delete("/manage/keyword/delete", deleteKeywords)
	.delete("/manage/keyword/:id", withToken, deleteKeyword)
	.put("/manage/keyword/remark", withToken, updateRemark).get("/manage/keyword/byId", withToken, getKeywordById)
	.get("/manage/category/list", withToken, listCategory).post("/manage/category/add", withToken, addCategory)
	.delete("/manage/category/:id", withToken, deleteCategory);

export default { ...router }


