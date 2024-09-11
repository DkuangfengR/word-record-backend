import { RequestHandler } from 'itty-router';
import { SignJWT, jwtVerify, JWTVerifyOptions } from 'jose';

// login
export const login: RequestHandler = async ({ query }, env) => {
    if (query.username === env.USER_NAME && query.password === env.USER_PASSWORD) {
        const second = Math.floor(parseInt(query.t as string) / 1000);
        const token = await new SignJWT(query).setProtectedHeader({ alg: 'HS512' }).setIssuedAt(second)
            .setExpirationTime(second + 2 * 60 * 60).sign(new TextEncoder().encode(env.JWT_SECRET));
        return new Response(JSON.stringify({
            code: 0,
            msg: "登录成功",
            token: token,
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
export const withToken: RequestHandler = async (request, env) => {
    const token = request.headers.get('token');
    if (!token || !(await isValidJwt(token, env.JWT_SECRET, { algorithms: ['HS512'] }))) {
        return new Response(JSON.stringify({
            code: -2,
            msg: "状态失效"
        }), { headers: { 'Content-Type': 'application/json' } });
    }
}

// 验证 JWT 的伪函数
async function isValidJwt(token: string, secret: string, opt: JWTVerifyOptions): Promise<boolean> {
    try {
        await jwtVerify(token, new TextEncoder().encode(secret), opt);
        return true;
    } catch (error) {
        return false;
    }
}

