export interface Env {
    WRBDB: D1Database;
    WRBB: R2Bucket;
}

export async function queryDatabase(env: Env, query: string, params: any[] = []): Promise<any> {
    return await env.WRBDB.prepare(query).bind(...params).all();
}

export async function executeDatabase(env: Env, query: string, params: any[] = []): Promise<void> {
    await env.WRBDB.prepare(query).bind(...params).run();
}
