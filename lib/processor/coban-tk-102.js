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

const Processor = require('../processor');
const Message = require('../message');
const regex = {
  logon:     /^##,imei:(\d{15,16}),A;$/,
  heartbeat: /^(\d{15,16});?$/,
  track:     /^imei:(\d{15,16}),([\w ]+),(\d*),(\d*),(l|f),([\d.]*)(?:,([av]?),([\w.]*),([ns]?),([\w.]*),([ew]?),([\d.]*),([\d.]*)(?:,([\d.]*),([01]*),([01]*),([\d.%]*),([\d.%]*),([\d.]*))?)?;$/i
};

class CobanTk102 extends Processor {
  /**
   * @param {net.Socket} socket
   * @param {String} data
   */
  constructor(socket, data) {
    super(socket, data);

    const message = parseMessage(data);
    this._imei = message.imei;
  }

  /**
   * @param {String} msg
   * @returns {Message}
   */
  process(msg) {
    const message = parseMessage(msg);

    if('logon' === message.cmd) {
      this._logger.trace('Sending "LOAD;" to device ...');
      this._socket.write('LOAD;', () => {
        this._logger.trace('Sending "LOAD;" to device ... success');
      });
      this._logger.trace('Sending "C,10s;" to device ...');
      this._socket.write(`**,imei:${message.imei},C,10s;`, () => {
        this._logger.trace('Sending "C,10s;" to device ... success');
      });
    }

    if('heartbeat' === message.cmd) {
      this._logger.trace('Sending "ON;" to device ...');
      this._socket.write('ON;', () => {
        this._logger.trace('Sending "ON;" to device ... success');
      });
    }

    return message;
  }
}

module.exports = CobanTk102;

/**
 *
 * @param {String} msg
 * @returns {Message}
 */
function parseMessage(msg) {
  let matches = regex.logon.exec(msg);
  if(matches) {
    return new Message(true, matches[1], 'logon');
  }

  matches = regex.heartbeat.exec(msg);
  if(matches) {
    return new Message(true, matches[1], 'heartbeat');
  }

  matches = regex.track.exec(msg);
  if(matches) {
    const message = new Message(true, matches[1], matches[2]);

    message.trck = convertDateTimeToTimestamp(matches[6]);

    if('F' === matches[5].toUpperCase()) {
      message.gps.fix = ('A' === matches[7].toUpperCase());
      message.gps.position = [calcDecDegree(matches[10], matches[11]), calcDecDegree(matches[8], matches[9])];
      if(matches[12]) {
        message.gps.speed = parseFloat(matches[12]);
      }
      if(matches[13]) {
        message.gps.heading = parseFloat(matches[13]);
      }
      if(matches[14]) {
        message.gps.alt = parseFloat(matches[14]);
      }
    }

    if(matches[15]) {
      message.sensors.ign = !!parseInt(matches[15]);
    }
    if(matches[16]) {
      message.sensors.door = !!parseInt(matches[16]);
    }
    if(matches[17]) {
      message.sensors.fuel_1 = parseFloat(matches[17]);
    }
    if(matches[18]) {
      message.sensors.fuel_2 = parseFloat(matches[18]);
    }
    if(matches[19]) {
      message.sensors.temp = parseFloat(matches[19]);
    }

    return message;
  }

  return new Message(false, null, null);
}

/**
 * Converts the gps timestamp into a normalized UTC timestamp
 *
 * @param gpsTime
 * @returns {Number}
 */
function convertDateTimeToTimestamp(gpsTime) {
  var test = parseInt(gpsTime), local, gps, localHour;

  if(test !== test || !test) {
    return 0;
  }

  local = new Date();
  gps = {
    hour: parseInt(gpsTime.substr(0, 2)),
    minute: parseInt(gpsTime.substr(2, 2)),
    second: parseInt(gpsTime.substr(4, 2)),
    msec: parseInt(gpsTime.substr(7, 3))
  };

  if((localHour = local.getUTCHours()) != gps.hour) {
    if(gps.hour === 0) {
      local.setUTCDate(local.getUTCDate() + 1);
    }
    if(localHour === 0) {
      local.setUTCDate(local.getUTCDate() - 1);
    }
    local.setUTCHours(gps.hour);
  }
  local.setUTCMinutes(gps.minute, gps.second, gps.msec);

  return local.getTime();
}

/**
 * Converts coordination values from degree-minutes to decimal
 * Returns null if an error occurred
 *
 * @param degreeMinutes
 * @param vector
 * @returns {Number|null}
 */
function calcDecDegree(degreeMinutes, vector) {
  var degrees, minutes, decimal;

  if (typeof degreeMinutes !== 'string' || typeof vector !== 'string') {
    return null;
  }
  if (['N', 'S', 'E', 'W'].indexOf(vector) === -1) {
    return null;
  }

  try {
    minutes = degreeMinutes.substr(-7, 7);
    degrees = parseInt(degreeMinutes.replace(minutes, ''));
    decimal = degrees + (minutes / 60);

    decimal = parseFloat((vector == 'S' || vector == 'W' ? '-' : '') + decimal);
    decimal = Math.round(decimal * 1000000) / 1000000;
    if (isNaN(decimal)) {
      return null;
    }
    return decimal;
  } catch (e) {
    return null;
  }
}