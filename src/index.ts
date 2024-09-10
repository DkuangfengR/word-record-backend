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

import { Router, withContent, withParams } from 'itty-router';
import { login, withToken } from './utils';
import { listColors, addColor, updateColor, deleteColor, listKeyword, addKeyword, updateGroupId, deleteKeywords, deleteKeyword, updateRemark, getKeywordById, addCategory, deleteCategory } from './handlers';

const router = Router();

router.get('/manage/login', login)
	.get('/manage/color/list', listColors).post("/manage/color/add", withToken, addColor)
	.put("/manage/color/update", withToken, updateColor).delete("/manage/color/:id", withToken, deleteColor)
	.get("/manage/keyword/list", withToken, listKeyword).post("/manage/keyword/add", addKeyword)
	.put("/manage/keyword/put", withToken, updateGroupId).delete("/manage/keyword/delete", deleteKeywords).delete("/manage/keyword/:id", withToken, deleteKeyword)
	.put("/manage/keyword/remark", withToken, updateRemark).get("/manage/keyword/byId", withToken, getKeywordById)
	.post("/manage/category/add", withToken, addCategory).delete("/manage/category/:id", withToken, deleteCategory);

export default { ...router }


