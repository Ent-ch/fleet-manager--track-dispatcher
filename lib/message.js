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

class Message {
  constructor(valid, imei, cmd) {
    this.valid = valid || false;
    this.imei = imei;
    this.cmd = cmd;
    this.rec = Date.now();

    this.trck = null;
    this.gps = {
      fix: false,
      position: null,
      speed: null,
      heading: null,
      alt: null
    };
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