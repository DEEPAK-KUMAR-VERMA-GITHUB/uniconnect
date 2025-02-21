import { verifyToken } from "../utils/jwt.js";

const connectedClients = new Map();

export const setupWebSocketHandlers = (fastify) => {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
      connection.socket.close();
      return;
    }

    try {
      const decoded = verifyToken(token);
      connectedClients.set(decoded.id, connection.socket);

      connection.socket.on('message', (message) => {
        // Handle incoming messages if needed
      });

      connection.socket.on('close', () => {
        connectedClients.delete(decoded.id);
      });
    } catch (error) {
      connection.socket.close();
    }
  });
};

export const sendNotification = (userId, notification) => {
  const userSocket = connectedClients.get(userId);
  if (userSocket) {
    userSocket.send(JSON.stringify(notification));
  }
};