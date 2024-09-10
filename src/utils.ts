import { RequestHandler, json } from 'itty-router';
import { sign, verify, VerifyOptions } from 'jsonwebtoken';

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

