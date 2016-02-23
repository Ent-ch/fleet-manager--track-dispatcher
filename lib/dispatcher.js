/**
 * Copyright 2016 Sebastian Ulbricht
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const EventEmitter = require('events');
const path = require('path');
const fs = require('fs');
const net = require('net');
const bunyan = require('bunyan');
const uuid = require('uuid');

/**
 * Creates a Server that listens for incoming connections from GPS devices.
 *
 * When a device connects, the server tries to determine the protocol of
 *     the device and, on success, starts to receive the track messages
 *     of the device.
 */
class Dispatcher extends EventEmitter {
  /**
   *
   * @param options
   */
  constructor(options) {
    super();

    options = options || {};
    options.port = options.port || 9000;
    options.logLevel = options.logLevel || 'info';

    this._processors = {};
    this._loadProcessors();

    this._logger = bunyan.createLogger({
      name: 'TrackDispatcher',
      level: options.logLevel
    });

    this._server = net.createServer(this._onConnection.bind(this));
    this._server.on('error', this._logger.error.bind(this._logger));
    this._server.listen(options, () => {
      const addr = this._server.address();
      this._logger.info(`TrackDispatcher is listening on ${addr.address}:${addr.port}`);
    });
  }

  /**
   *
   * @param socket
   * @private
   */
  _onConnection(socket) {
    socket.id = uuid.v4();
    socket.logger = this._logger.child({session: socket.id});

    socket.on('error', (error) => {
      socket.logger.error(error);
      this.emit('session-finished', socket.id);
    });

    socket.on('timeout', () => {
      this.emit('session-finished', socket.id);
    });

    socket.on('end', () => {
      this.emit('session-finished', socket.id);
    });

    socket.setNoDelay(true);

    socket.setTimeout(70000, () => {
      socket.destroy();
    });

    socket.on('data', this._onSocketData.bind(this, socket));

    this.emit('session-started', socket.id);
  }

  /**
   *
   * @param socket
   * @param data
   * @returns {*}
   * @private
   */
  _onSocketData(socket, data) {
    let index;

    if(!socket.msgBuffer) {
      socket.msgBuffer = '';
    }

    if(data instanceof Buffer) {
      data = data.toString();
    }
    data = data.trim();

    if((index = data.indexOf(';')) !== -1) {
      socket.msgBuffer += data;
      return;
    }

    socket.msgBuffer += data.substr(0, index);
    this._handleMessage(socket);

    return this._onSocketData(socket, data.substr(++index));
  }

  /**
   *
   * @param socket
   * @returns {*}
   * @private
   */
  _handleMessage(socket) {
    const data = socket.msgBuffer;
    let message;

    socket.msgBuffer = '';

    socket.logger.trace({
      data: data
    });

    if(!socket.processor) {
      this._identifyProcessor(socket, data);

      if(!socket.imei) {
        socket.logger.error('Unknown protocol');
        return socket.destroy();
      }
    }

    message = socket.processor.process(data);
    this.emit('session-data', socket.id, message);
  }

  /**
   *
   * @param socket
   * @param data
   * @private
   */
  _identifyProcessor(socket, data) {
    const signature = data.substr(0, 2);
    let protocol;

    switch (signature) {
      case '##':
        protocol = 'coban-tk-102';
        break;
      default:
        return;
    }

    socket.processor = new this._processors[protocol](socket, data);
    socket.imei = socket.processor.getImeiNumber();
  }

  /**
   *
   * @private
   */
  _loadProcessors() {
    const processorPath = path.join(__dirname, 'processor');
    const processorFiles = fs.readdirSync(processorPath);
    let match;

    for(let file of processorFiles) {
      if(match = /^(.+)\.js$/i.exec(file)) {
        this._processors[match[1]] = require(path.join(processorPath, file));
      }
    }
  }

}

module.exports = Dispatcher;