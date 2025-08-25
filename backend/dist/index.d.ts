import { Server } from 'socket.io';
import '@/config/cache';
import { prisma } from '@/config/database';
declare const app: import("express-serve-static-core").Express;
declare const server: import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
declare const io: Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export { app, server, io, prisma };
//# sourceMappingURL=index.d.ts.map