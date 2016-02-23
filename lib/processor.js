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

const __noop__ = function() {};

/**
 * The base class all processors should extend.
 *
 * A processor will bind to the socket connection of a device and
 *     parses and transforms all incoming messages of this device
 *
 * @abstract
 */
class Processor {
  /**
   *
   * @param {net.Socket} socket
   * @param data
   */
  constructor(socket, data) {
    super();

    /**
     * @type {net.Socket}
     * @private
     */
    this._socket = socket;
    /**
     * @type {{
     *   trace: function,
     *   log: function,
     *   warn: function,
     *   error: function
     * }}
     * @private
     */
    this._logger = socket.logger;
    /**
     * @type {String}
     * @private
     */
    this._imei = null;

    if(!this._logger) {
      this._logger = {
        trace: __noop__,
        log: __noop__,
        warn: __noop__,
        error: __noop__
      }
    }
  }

  /**
   * Returns the IMEI number of the current device or null when no IMEI is available
   *
   * @returns {String|null}
   */
  getImeiNumber() {
    return this._imei;
  }

  /**
   * Returns a Message instance containing a parsed and transformed message
   *     from the current device
   *
   * @param message
   * @returns {Message}
   */
  process(message) {
    this._logger.error('`process` is not implemented');
    return {};
  }
}

module.exports = Processor;