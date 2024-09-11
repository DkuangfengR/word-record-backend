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

import { Router } from 'itty-router';
import { RequestHandler, IRequest } from 'itty-router';
import { sign, verify, VerifyOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

/********************* types ************************/
export type Handler<Env> = (
    request: Request,
    env: Env,
    context: ExecutionContext
) => Promise<Response>;


/******************** utils ************************/

// login
export const login: RequestHandler = ({ query }, env) => {
    if (query.username === env.USER_NAME && query.password === env.USER_PASSWORD) {
        return new Response(JSON.stringify({
            code: 0,
            msg: "登录成功",
            token: sign(query, env.JWT_SECRET, { expiresIn: '2h', algorithm: 'HS512' }),
            username: query.username
        }), { headers: { 'Content-Type': 'application/json' } });
    } else {
        return new Response(JSON.stringify({
            code: -1,
            msg: "账号或密码错误"
        }), { headers: { 'Content-Type': 'application/json' } });
    }
}

// verify
export const withToken: RequestHandler = (request, env) => {
    const token = request.headers.get('token');
    if (!token || !isValidJwt(token, env.JWT_SECRET, { algorithms: ['HS512'] })) {
        return new Response(JSON.stringify({
            code: -2,
            msg: "状态失效"
        }), { headers: { 'Content-Type': 'application/json' } });
    }
}

// 验证 JWT 的伪函数
function isValidJwt(token: string, secret: string, opt: VerifyOptions): boolean {
    try {
        verify(token, secret, opt);
    } catch (error) {
        return false;
    }
    return true;
}


/******************** database ************************/
export interface Env {
    WRBDB: D1Database;
}

export async function queryDatabase(env: Env, query: string, params: any[] = []): Promise<any> {
    return await env.WRBDB.prepare(query).bind(...params).all();
}

export async function executeDatabase(env: Env, query: string, params: any[] = []): Promise<void> {
    await env.WRBDB.prepare(query).bind(...params).run();
}


/******************** handlers ************************/

export async function listColors({ query }: { query: { page: string, size: string } }, env: Env): Promise<Response> {
  const page = parseInt(query.page || '1');
  const size = parseInt(query.size || '100');

  const offset = (page - 1) * size;
  const colors = await queryDatabase(env, 'SELECT * FROM home_colortable LIMIT ? OFFSET ?', [size, offset]);

  const total = await queryDatabase(env, 'SELECT COUNT(*) as count FROM home_colortable');

  return new Response(JSON.stringify({
    code: 0,
    result: colors.results,
    total: total.results[0].count,
  }), { headers: { 'Content-Type': 'application/json' } });
}

export async function addColor(request: IRequest, env: Env): Promise<Response> {
  const data: { color: string, desc: string, status: number, create_time: string } = await request.json();
  await executeDatabase(env, 'INSERT INTO home_colortable (color, desc, status, create_time) VALUES (?, ?, ?, ?)', [data.color, data.desc, data.status || 0, data.create_time || new Date().toISOString()]);
  return new Response(JSON.stringify({ code: 0, msg: "success" }), { headers: { 'Content-Type': 'application/json' } });
}

export async function updateColor(request: IRequest, env: Env): Promise<Response> {
  const data: { color: string, desc: string, status: number, id: number } = await request.json();
  await executeDatabase(env, 'UPDATE home_colortable SET color = ?, desc = ?, status = ? WHERE id = ?', [
    data.color, data.desc, data.status, data.id
  ]);
  return new Response(JSON.stringify({ code: 0, msg: "success" }), { headers: { 'Content-Type': 'application/json' } });
}

export async function deleteColor(request: IRequest, env: Env): Promise<Response> {
  await executeDatabase(env, 'DELETE FROM home_colortable WHERE id = ?', [parseInt(request.params.id)]);
  return new Response(JSON.stringify({ code: 0 }), { headers: { 'Content-Type': 'application/json' } });
}

export async function listKeyword(request: IRequest, env: Env): Promise<Response> {
  const page = parseInt((request.query.page as string) || '1');
  const size = parseInt((request.query.size as string) || '100');

  const offset = (page - 1) * size;
  const keywords = await queryDatabase(env, 'SELECT * FROM home_keywordtable LIMIT ? OFFSET ?', [size, offset]);

  const total = await queryDatabase(env, 'SELECT COUNT(*) as count FROM home_keywordtable');

  return new Response(JSON.stringify({
    code: 0,
    result: keywords.results,
    total: total.results[0].count,
  }), { headers: { 'Content-Type': 'application/json' } });
}

export async function addKeyword(request: IRequest, env: Env): Promise<Response> {
  const data: { keyword: string, keyword_heavy: string, keyword_html: string, definition: string, industry_definition: string, anagram: string, group_id: string, create_time: string, remark: string } = await request.json();

  const existing = await queryDatabase(env, 'SELECT id FROM home_keywordtable WHERE keyword = ?', [data.keyword]);

  if (existing.results.length > 0) {
    return new Response(JSON.stringify({ code: -1, msg: "单词已收藏", id: existing.results[0].id }));
  } else {
    await executeDatabase(env, 'INSERT INTO home_keywordtable (keyword, keyword_heavy, keyword_html, definition, industry_definition, anagram, create_time) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      data.keyword, data.keyword_heavy, data.keyword_html, data.definition, data.industry_definition, data.anagram, data.create_time || new Date().toISOString()
    ]);
    const inserted = await queryDatabase(env, 'SELECT id FROM home_keywordtable WHERE keyword = ?', [data.keyword]);
    return new Response(JSON.stringify({ coce: 0, msg: "操作成功", id: inserted.results[0].id }));
  }
}

export async function updateGroupId(request: IRequest, env: Env): Promise<Response> {
  const data: { id: Array<number>, group_id: string } = await request.json();
  const query = `UPDATE home_keywordtable SET group_id = ? WHERE id IN (${data.id.join(', ')})`;
  await executeDatabase(env, query, [data.group_id]);
  return new Response(JSON.stringify({ code: 0, msg: "success" }), { headers: { 'Content-Type': 'application/json' } });
}

// delete keyword on batch
export async function deleteKeywords(request: IRequest, env: Env): Promise<Response> {
  const ids: Array<number> = await request.json();
  await executeDatabase(env, `DELETE FROM home_keywordtable WHERE id IN (${ids.join(', ')})`);
  return new Response(JSON.stringify({ code: 0, msg: "操作成功" }), { headers: { 'Content-Type': 'application/json' } });
}

// delete keyword by id
export async function deleteKeyword(request: IRequest, env: Env): Promise<Response> {
  await executeDatabase(env, 'DELETE FROM home_keywordtable WHERE id = ?', [parseInt(request.params.id)]);
  return new Response(JSON.stringify({ code: 0, msg: "操作成功" }), { headers: { 'Content-Type': 'application/json' } });
}

export async function updateRemark(request: IRequest, env: Env): Promise<Response> {
  const data: { id: number, remark: string } = await request.json();
  await executeDatabase(env, 'UPDATE home_keywordtable SET remark = ? WHERE id = ?', [data.remark, data.id]);
  return new Response(JSON.stringify({ code: 0, msg: "success" }), { headers: { 'Content-Type': 'application/json' } });
}

export async function getKeywordById(request: IRequest, env: Env): Promise<Response> {
  const keywords = await queryDatabase(env, 'SELECT hk.*, hc.name FROM home_keywordtable hk left join home_categorytable hc on hk.group_id = hc.uuid where hk.id = ?', [parseInt((request.query.id as string))]);
  return new Response(JSON.stringify({
    code: 0,
    result: keywords.results
  }), { headers: { 'Content-Type': 'application/json' } });
}

export async function addCategory(request: IRequest, env: Env): Promise<Response> {
  const data: { id?: number, uuid: string, name: string, create_time?: string } = await request.json();
  if (!data.id) {
    await executeDatabase(env, 'INSERT INTO home_categorytable (uuid, name, create_time) VALUES (?, ?, ?)', [uuidv4().replace(/-/g, ''), data.name, data.create_time || new Date().toISOString()]);
  } else {
    await executeDatabase(env, 'UPDATE home_categorytable set uuid = ?, name = ?, create_time = ? where id = ?', [data.uuid, data.name, data.create_time || new Date().toISOString(), data.id]);
  }
  return new Response(JSON.stringify({ code: 0, msg: "success" }), { headers: { 'Content-Type': 'application/json' } });
}

export async function deleteCategory(request: IRequest, env: Env): Promise<Response> {
  await executeDatabase(env, 'DELETE FROM home_categorytable WHERE id = ?', [parseInt(request.params.id)]);
  return new Response(JSON.stringify({ code: 0 }), { headers: { 'Content-Type': 'application/json' } });
}



/********************* router ************************/
const router = Router();

router.get('/manage/login', login)
	.get('/manage/color/list', listColors).post("/manage/color/add", withToken, addColor)
	.put("/manage/color/update", withToken, updateColor).delete("/manage/color/:id", withToken, deleteColor)
	.get("/manage/keyword/list", withToken, listKeyword).post("/manage/keyword/add", addKeyword)
	.put("/manage/keyword/put", withToken, updateGroupId).delete("/manage/keyword/delete", deleteKeywords).delete("/manage/keyword/:id", withToken, deleteKeyword)
	.put("/manage/keyword/remark", withToken, updateRemark).get("/manage/keyword/byId", withToken, getKeywordById)
	.post("/manage/category/add", withToken, addCategory).delete("/manage/category/:id", withToken, deleteCategory);

export default { ...router }
