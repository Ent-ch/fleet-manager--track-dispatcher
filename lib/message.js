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

/**
 * A data type holding all the informations of a single track message
 */
class Message {
  /**
   * @param {Boolean} valid
   * @param {String} imei
   * @param {String} cmd
   */
  constructor(valid, imei, cmd) {
    /**
     * True if the processor found a valid track message
     * @type {Boolean}
     */
    this.valid = valid || false;
    /**
     * The IMEI number of the device which sent the message
     * @type {String}
     */
    this.imei = imei;
    /**
     * The message type (e.g. logon, heartbeat, alert, etc)
     * @type {String}
     */
    this.cmd = cmd;
    /**
     * The timestamp of when this Message instance was created
     * @type {Number}
     */
    this.rec = Date.now();
    /**
     * The timestamp of when the track message was created
     * @type {Number}
     */
    this.trck = null;
    /**
     * The GPS data (null means the data were not available)
     * - fix:      true if the device found enough satellites for high precision data
     * - position: an array containing longitude[0] and latitude[1]
     * - speed:    the speed in knots
     * - heading:  the direction in degree
     * - alt:      the altitude in meters
     *
     * @type {{
     *   fix: Boolean,
     *   position: [Number,Number]|null,
     *   speed: Number|null,
     *   heading: Number|null,
     *   alt: Number|null
     * }}
     */
    this.gps = {
      fix: false,
      position: null,
      speed: null,
      heading: null,
      alt: null
    };
    /**
     * The sensor data (null means the sensor is not available)
     * - ign:    status of the ignition sensor
     * - door:   status of the door sensors
     * - fuel_1: percentage of fuel sensor 1
     * - fuel_2: percentage of fuel sensor 2
     * - temp:   value of the temperature sensor in °C
     *
     * @type {{
     *   ign: Boolean|null,
     *   door: Boolean|null,
     *   fuel_1: Number|null,
     *   fuel_2: Number|null,
     *   temp: Number|null
     * }}
     */
    this.sensors = {
      ign: null,
      door: null,
      fuel_1: null,
      fuel_2: null,
      temp: null
    };
  }
}

module.exports = Message;