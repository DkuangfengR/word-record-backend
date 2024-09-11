import { Env, queryDatabase, executeDatabase } from './db';
import { v4 as uuidv4 } from 'uuid';
import { IRequest } from 'itty-router';

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
  const keywords = await queryDatabase(env, 'SELECT hk.*, hc.name FROM home_keywordtable hk left join home_categorytable hc on hk.group_id = hc.uuid LIMIT ? OFFSET ?', [size, offset]);

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
    return new Response(JSON.stringify({ code: -1, msg: "单词已收藏", id: existing.results[0].id }), { headers: { 'Content-Type': 'application/json' } });
  } else {
    await executeDatabase(env, 'INSERT INTO home_keywordtable (keyword, keyword_heavy, keyword_html, definition, industry_definition, anagram, create_time) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      data.keyword, data.keyword_heavy, data.keyword_html, data.definition, data.industry_definition, data.anagram, data.create_time || new Date().toISOString()
    ]);
    const inserted = await queryDatabase(env, 'SELECT id FROM home_keywordtable WHERE keyword = ?', [data.keyword]);
    return new Response(JSON.stringify({ coce: 0, msg: "操作成功", id: inserted.results[0].id }), { headers: { 'Content-Type': 'application/json' } });
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

export async function listCategory(request: IRequest, env: Env): Promise<Response> {
  const page = parseInt((request.query.page as string) || '1');
  const size = parseInt((request.query.size as string) || '100');

  const offset = (page - 1) * size;
  const categories = await queryDatabase(env, 'SELECT * FROM home_categorytable LIMIT ? OFFSET ?', [size, offset]);

  const total = await queryDatabase(env, 'SELECT COUNT(*) as count FROM home_categorytable');

  return new Response(JSON.stringify({
    code: 0,
    result: categories.results,
    total: total.results[0].count,
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

// delete keyword on batch
export async function download(request: IRequest, env: Env): Promise<Response> {
  const ids: Array<number> = await request.json();
  if (!!ids && ids.length > 0) {

  }
  await executeDatabase(env, `DELETE FROM home_keywordtable WHERE id IN (${ids.join(', ')})`);
  return new Response(JSON.stringify({ code: 0, msg: "操作成功" }), { headers: { 'Content-Type': 'application/json' } });
}