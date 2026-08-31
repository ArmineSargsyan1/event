import dotenv from 'dotenv';
dotenv.config();
import _ from 'lodash';
import { Server as SocketServer } from 'socket.io';
import jwt from "jsonwebtoken";
import Message from '../models/Message.js';


const { AUTH_SECRET } = process.env;

class Socket {
  static io = null;

  static init = async (server) => {
    this.io = new SocketServer(server, {
      cors: {
        origin: '*',
        methods: 'GET, POST',
      }
    });
    this.io.on('connection', this.handleConnect);
  };

  static handleConnect = async (client) => {
    try {
      let authorization =
        _.get(client, 'handshake.headers.authorization', null)
        || _.get(client, 'handshake.query.authorization', null)
        || _.get(client, 'handshake.query.token', null);

      if (!authorization) {
        client.emit('error', { message: 'Authorization token is required!' });
        return;
      }


      let pureToken = `${authorization}`.trim();
      if (pureToken.toLowerCase().startsWith('bearer ')) {
        pureToken = pureToken.slice(7).trim();
      }

      const { valid, id } = Socket.tokenChecker(pureToken);


      if (!valid) {
        client.emit('error', { message: 'Invalid Token' });
        return;
      }

      if (id) {
        console.log(`JOINED to -> user_${id}`);
        client.join(`user_${id}`);
        console.log(`USER WITH ID: ${id} connected`);
      }

      client.on('join', (userId) => {
        client.join(userId);
        console.log(`User ${userId} joined room via legacy join event!`);
      });

      client.on('send_direct_message', async (data) => {
        const { receiverId, text, senderId } = data;
        try {
          const newMessage = await Message.create({
            senderId,
            receiverId,
            text,
            isRead: false,
          });

          Socket.io.to(`user_${receiverId}`).emit('new_message', newMessage);
          Socket.io.to(receiverId).emit('new_message', newMessage);
          client.emit('message_sent', newMessage);
        } catch (error) {
          console.error("Error saving message:", error);
        }
      });

      client.on('typing', ({ receiverId, senderId }) => {
        Socket.io.to(`user_${receiverId}`).emit('user_typing', { senderId });
        Socket.io.to(receiverId).emit('user_typing', { senderId });
      });

      client.on('stop_typing', ({ receiverId, senderId }) => {
        Socket.io.to(`user_${receiverId}`).emit('user_stop_typing', { senderId });
        Socket.io.to(receiverId).emit('user_stop_typing', { senderId });
      });

      client.on('message_seen', async ({ messageId, senderId, receiverId }) => {
        try {
          await Message.update({ isRead: true }, { where: { id: messageId } });
          Socket.io.to(`user_${senderId}`).emit('message_status_updated', {
            messageId,
            status: 'read',
            readerId: receiverId
          });
          Socket.io.to(senderId).emit('message_status_updated', {
            messageId,
            status: 'read',
            readerId: receiverId
          });
        } catch (error) {
          console.error("Status update error:", error);
        }
      });

      client.on('call_user', ({ userToCall, signalData, from, fromName }) => {
        Socket.io.to(`user_${userToCall}`).emit('incoming_call', {
          signal: signalData,
          from,
          name: fromName
        });
        Socket.io.to(userToCall).emit('incoming_call', {
          signal: signalData,
          from,
          name: fromName
        });
      });

      client.on('answer_call', (data) => {
        Socket.io.to(`user_${data.to}`).emit('call_accepted', data.signal);
        Socket.io.to(data.to).emit('call_accepted', data.signal);
      });

      client.on('reject_call', ({ to }) => {
        Socket.io.to(`user_${to}`).emit('call_rejected');
        Socket.io.to(to).emit('call_rejected');
      });

      client.on('end_call', ({ to }) => {
        Socket.io.to(`user_${to}`).emit('call_ended');
        Socket.io.to(to).emit('call_ended');
      });

      client.on('ice_candidate', ({ to, candidate }) => {
        Socket.io.to(`user_${to}`).emit('ice_candidate', { candidate });
        Socket.io.to(to).emit('ice_candidate', { candidate });
      });

      client.on('disconnect', Socket.handleDisconnect(client, { id }));
    } catch (e) {
      console.error(e);
      client.emit('error', { message: 'Invalid Token' });
    }
  };

  static tokenChecker = (token) => {
    let decoded = {};
    try {

      decoded = jwt.verify(token, process.env.AUTH_SECRET);
    } catch (err) {
      console.log("JWT error:", err.message);
    }

    if (!decoded || !decoded.id) {
      return { valid: false, id: null };
    }

    return { valid: true, id: +decoded.id };
  };

  static emit = async (room, message, type = 'new_message') => {
    try {
      console.log('Emit:', room, message, type);
      Socket.io.to(room).emit(type, message);
    } catch (e) {
      console.error(e.message);
    }
  };

  static handleDisconnect = (client, data) => async () => {
    try {
      client.disconnect();
      console.log(`USER WITH ID: ${data.id} disconnected`);
    } catch (e) {
      console.error(e);
    }
  };
}

export default Socket;
