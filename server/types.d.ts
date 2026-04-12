declare const __dirname: string;

declare const process: {
  env: Record<string, string | undefined>;
};

declare module 'node:path' {
  interface PathModule {
    resolve(...paths: string[]): string;
  }

  const path: PathModule;
  export default path;
}

declare module 'morgan' {
  type MorganMiddleware = (...args: unknown[]) => void;

  function morgan(format: string): MorganMiddleware;

  export default morgan;
}

declare module 'express' {
  interface Request {}

  interface Response {
    type(value: string): this;
    send(body: string): void;
    sendFile(filePath: string): void;
  }

  type NextFunction = () => void;
  type RequestHandler = (req: Request, res: Response, next?: NextFunction) => void;

  interface ExpressApp {
    use(handler: RequestHandler): void;
    use(path: string, handler: RequestHandler): void;
    get(path: string, handler: RequestHandler): void;
    listen(port: number, callback?: () => void): void;
  }

  interface ExpressModule {
    (): ExpressApp;
    static(root: string): RequestHandler;
  }

  const express: ExpressModule;

  export default express;
}
