export type Handler<Env> = (
    request: Request,
    env: Env,
    context: ExecutionContext
) => Promise<Response>;
