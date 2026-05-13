import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*' }
  });


  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    // Creator joins their poll room to receive live updates
    socket.on('join-poll', (pollId: string) => {
      socket.join(`poll:${pollId}`);
    });

    socket.on('leave-poll', (pollId: string) => {
      socket.leave(`poll:${pollId}`);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

