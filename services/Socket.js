import _ from 'lodash';
import { Server as SocketServer } from 'socket.io';
import jwt from "jsonwebtoken";

const { AUTH_SECRET } = process.env;

class Socket {
  static init = async (server) => {
    this.io = new SocketServer(server);
    this.io.on('connection', this.handleConnect);
  };

  static handleConnect = async (client) => {
    try {
      const authorization =
        _.get(client, 'handshake.headers.authorization', null)
        || _.get(client, 'handshake.query.authorization', null)
        || _.get(client, 'handshake.query.token', null);

      if (!authorization) {
        client.emit('error', { message: 'Authorization token is required!' });
        return;
      }

      const { valid, id } = this.tokenChecker(`${authorization}`.replace('Bearer', '').trim());

      if (!valid) {
        client.emit('error', { message: 'Invalid Token' });
        return;
      }

      if (id) {
        console.log(`JOINED to -> ${`user_${id}`}`)
        client.join(`user_${id}`);
        console.log(`USER WITH ID: ${id} connected`);
      }

      client.on('disconnect', this.handleDisconnect(client, { id }));
    } catch (e) {
      console.error(e);
      client.emit('error', { message: 'Invalid Token' });
    }
  };

  static tokenChecker = (token) => {
    let decoded = {};

    try {
      decoded = jwt.verify(token, AUTH_SECRET);
    } catch (err) {
      console.log(err);
    }

    if (!decoded) {
      return { valid: false, id: null };
    }

    return { valid: true, id: +decoded.userId };
  };

  static emit = async (room, message, type = 'new_message') => {
    try {
      console.log('Emmit:', room, message, type)

      this.io.to(room).emit(type, message);
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
