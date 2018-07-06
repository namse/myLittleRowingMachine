/**
 * Created by tijmen on 25-12-15.
 */

var bleat = require('bleat').classic;
const ergometer = {};

/**
* Created by tijmen on 25-12-15.
*/
/** @internal */
(function (ergometer) {
    var utils;
    (function (utils) {
        function getByte(value, byteIndex) {
            return (value >> (byteIndex * 8)) & 255;
        }
        utils.getByte = getByte;
        function copyArrayBuffer(src) {
            var dst = new ArrayBuffer(src.byteLength);
            new Uint8Array(dst).set(new Uint8Array(src));
            return dst;
        }
        utils.copyArrayBuffer = copyArrayBuffer;
        /**
        * Interpret byte buffer as unsigned little endian 32 bit integer.
        * Returns converted number.
        * @param {ArrayBuffer} data - Input buffer.
        * @param {number} offset - Start of data.
        * @return Converted number.
        * @public
        */
        function getUint24(data, offset) {
            return (data.getUint8(offset + 2) << 16) +
                (data.getUint8(offset + 1) << 8) +
                (data.getUint8(offset));
        }
        utils.getUint24 = getUint24;
        function bufferToString(buf) {
            return String.fromCharCode.apply(null, new Uint8Array(buf));
        }
        utils.bufferToString = bufferToString;
        function valueToNullValue(value, nullValue) {
            if (value == nullValue)
                return null;
            else
                return value;
        }
        utils.valueToNullValue = valueToNullValue;
        function isDefined(variable) {
            return typeof variable !== 'undefined';
        }
        utils.isDefined = isDefined;
        /**
         * Takes a ArrayBuffer or TypedArray and returns its hexadecimal representation.
         * No spaces or linebreaks.
         * @param data
         * @public
         */
        /**
         * Returns the integer i in hexadecimal string form,
         * with leading zeroes, such that
         * the resulting string is at least byteCount*2 characters long.
         * @param {int} i
         * @param {int} byteCount
         * @public
         */
        function toHexString(i, byteCount) {
            var string = (new Number(i)).toString(16);
            while (string.length < byteCount * 2) {
                string = '0' + string;
            }
            return string;
        }
        utils.toHexString = toHexString;
        /**
         * Takes a ArrayBuffer or TypedArray and returns its hexadecimal representation.
         * No spaces or linebreaks.
         * @param data
         * @public
         **/
        function typedArrayToHexString(data) {
            // view data as a Uint8Array, unless it already is one.
            if (data.buffer) {
                if (!(data instanceof Uint8Array))
                    data = new Uint8Array(data.buffer);
            }
            else if (data instanceof ArrayBuffer) {
                data = new Uint8Array(data);
            }
            else {
                throw "not an ArrayBuffer or TypedArray.";
            }
            var str = '';
            for (var i = 0; i < data.length; i++) {
                str += toHexString(data[i], 1);
            }
            return str;
        }
        utils.typedArrayToHexString = typedArrayToHexString;
        function hexStringToTypedArray(hexData) {
            if (hexData.length % 2 != 0)
                throw "Wrong hexData string: " + hexData;
            var length = hexData.length / 2;
            var result = new Uint8Array(length);
            for (var i = 0; i < length; i++) {
                result[i] = parseInt(hexData.substring(i * 2, i * 2 + 2), 16);
            }
            return result;
        }
        utils.hexStringToTypedArray = hexStringToTypedArray;
        function getTime() {
            return new Date().getTime();
        }
        utils.getTime = getTime;
    })(utils = ergometer.utils || (ergometer.utils = {}));
})(ergometer || (ergometer = {}));
/**
 * Created by tijmen on 04/07/2017.
 *
 * queue function calls which returns a promise, converted to typescript
 * needed as work around for web blue tooth, this ensures that only one call is processed at at time
 *
 *
 */
/**
 * Created by tijmen on 04/07/2017.
 *
 * queue function calls which returns a promise, converted to typescript
 * needed as work around for web blue tooth, this ensures that only one call is processed at at time
 *
 *
 */
(function (ergometer) {
    var utils;
    (function (utils) {
        /**
         * @return {Object}
         */
        var FunctionQueue = /** @class */ (function () {
            function FunctionQueue(maxPendingPromises, maxQueuedPromises) {
                this.maxPendingPromises = Infinity;
                this.maxQueuedPromises = Infinity;
                this.pendingPromises = 0;
                this.queue = [];
                this.maxPendingPromises = typeof maxPendingPromises !== 'undefined' ? maxPendingPromises : Infinity;
                this.maxQueuedPromises = typeof maxQueuedPromises !== 'undefined' ? maxQueuedPromises : Infinity;
            }
            /**
             * @param {*} value
             * @returns {LocalPromise}
             */
            FunctionQueue.prototype.resolveWith = function (value) {
                if (value && typeof value.then === 'function') {
                    return value;
                }
                return new Promise(function (resolve) {
                    resolve(value);
                });
            };
            ;
            /**
             * @param {promiseGenerator}  a function which returns a promise
             * @param {context} the object which is the context where the function is called in
             * @param  {params} array of parameters for the function
             * @return {Promise} promise which is resolved when the function is acually called
             */
            FunctionQueue.prototype.add = function (promiseGenerator, context) {
                var params = [];
                for (var _i = 2; _i < arguments.length; _i++) {
                    params[_i - 2] = arguments[_i];
                }
                var self = this;
                return new Promise(function (resolve, reject) {
                    // Do not queue to much promises
                    if (self.queue.length >= self.maxQueuedPromises) {
                        reject(new Error('Queue limit reached'));
                        return;
                    }
                    // Add to queue
                    self.queue.push({
                        promiseGenerator: promiseGenerator,
                        context: context,
                        params: params,
                        resolve: resolve,
                        reject: reject
                    });
                    self._dequeue();
                });
            };
            ;
            /**
             * Number of simultaneously running promises (which are resolving)
             *
             * @return {number}
             */
            FunctionQueue.prototype.getPendingLength = function () {
                return this.pendingPromises;
            };
            ;
            /**
             * Number of queued promises (which are waiting)
             *
             * @return {number}
             */
            FunctionQueue.prototype.getQueueLength = function () {
                return this.queue.length;
            };
            ;
            /**
             * @returns {boolean} true if first item removed from queue
             * @private
             */
            FunctionQueue.prototype._dequeue = function () {
                var self = this;
                if (this.pendingPromises >= this.maxPendingPromises) {
                    return false;
                }
                // Remove from queue
                var item = this.queue.shift();
                if (!item) {
                    return false;
                }
                try {
                    this.pendingPromises++;
                    self.resolveWith(item.promiseGenerator.apply(item.context, item.params))
                        .then(function (value) {
                            // It is not pending now
                            self.pendingPromises--;
                            // It should pass values
                            item.resolve(value);
                            self._dequeue();
                        }, function (err) {
                            // It is not pending now
                            self.pendingPromises--;
                            // It should not mask errors
                            item.reject(err);
                            self._dequeue();
                        });
                }
                catch (err) {
                    self.pendingPromises--;
                    item.reject(err);
                    self._dequeue();
                }
                return true;
            };
            return FunctionQueue;
        }());
        utils.FunctionQueue = FunctionQueue;
    })(utils = ergometer.utils || (ergometer.utils = {}));
})(ergometer || (ergometer = {}));
/**
 *
 * Created by tijmen on 01-06-15.
 *
 * License:
 *
 * Copyright 2016 Tijmen van Gulik (tijmen@vangulik.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 *
 * Created by tijmen on 01-06-15.
 *
 * License:
 *
 * Copyright 2016 Tijmen van Gulik (tijmen@vangulik.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function (ergometer) {
    var pubSub;
    (function (pubSub) {
        var PubSub = /** @class */ (function () {
            function PubSub() {
                this.registry = {};
            }
            PubSub.prototype.pub = function (name) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                if (!this.registry[name])
                    return;
                this.registry[name].forEach(function (x) {
                    try {
                        x.func.apply(x.object, args);
                    }
                    catch (e) {
                        console.log(e);
                    }
                });
            };
            PubSub.prototype.pubASync = function (name) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                if (!this.registry[name])
                    return;
                this.registry[name].forEach(function (x) {
                    setTimeout(function () { x.func.apply(x.object, args); }, 0);
                });
            };
            PubSub.prototype.sub = function (applyObject, name, fn) {
                var evnt = this.registry[name];
                var newItem = { object: applyObject, func: fn };
                if (!evnt) {
                    this.registry[name] = [newItem];
                }
                else {
                    //never subscribe the same function twice
                    var funcExists = false;
                    evnt.forEach(function (item) {
                        if (item.func == fn)
                            funcExists = true;
                    });
                    if (!funcExists)
                        evnt.push(newItem);
                }
                this.pub("subscribed", name, this.subscribeCount(name));
            };
            PubSub.prototype.unsub = function (name, fn) {
                var evnt = this.registry[name];
                if (evnt) {
                    //remove the function
                    for (var i = evnt.length - 1; i >= 0; i--) {
                        if (evnt[i].func == fn)
                            evnt.splice(i, 1);
                    }
                }
                this.pub("unsubscribed", name, this.subscribeCount(name));
            };
            PubSub.prototype.subscribeCount = function (name) {
                var evnt = this.registry[name];
                if (evnt)
                    return evnt.length;
                else
                    return 0;
            };
            return PubSub;
        }());
        pubSub.PubSub = PubSub;
        //new style event using generics
        var Event = /** @class */ (function () {
            function Event() {
                this._subscribed = [];
            }
            Event.prototype.doChangedEvent = function () {
                if (this._subScriptionChangedEvent) {
                    this._subScriptionChangedEvent(this, this.count);
                }
            };
            Event.prototype.findSubscription = function (event) {
                this._subscribed.forEach(function (item) {
                    if (item.func == event)
                        return item;
                });
                return null;
            };
            Event.prototype.sub = function (applyObject, event) {
                var newItem = this.findSubscription(event);
                if (!newItem) {
                    newItem = { object: applyObject, func: event };
                    this._subscribed.push(newItem);
                    this.doChangedEvent();
                }
            };
            Event.prototype.unsub = function (event) {
                for (var i = this._subscribed.length - 1; i >= 0; i--) {
                    if (this._subscribed[i].func == event)
                        this._subscribed.splice(i, 1);
                }
                this.doChangedEvent();
            };
            Event.prototype.doPub = function (args) {
                this._subscribed.forEach(function (item) {
                    item.func.apply(item.object, args);
                });
            };
            Object.defineProperty(Event.prototype, "pub", {
                get: function () {
                    var pubsub = this;
                    var func = function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        pubsub.doPub(args);
                    };
                    return func;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Event.prototype, "pubAsync", {
                get: function () {
                    var pubsub = this;
                    var func = function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        setTimeout(function () {
                            pubsub.doPub(args);
                        });
                    };
                    return func;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Event.prototype, "count", {
                get: function () {
                    return this._subscribed.length;
                },
                enumerable: true,
                configurable: true
            });
            Event.prototype.registerChangedEvent = function (func) {
                this._subScriptionChangedEvent = func;
            };
            return Event;
        }());
        pubSub.Event = Event;
    })(pubSub = ergometer.pubSub || (ergometer.pubSub = {}));
})(ergometer || (ergometer = {}));
/**
 * Created by tijmen on 01-02-16.
 */
/**
 * Created by tijmen on 01-02-16.
 */
(function (ergometer) {
    var ble;
    (function (ble) {
        var DriverBleat = /** @class */ (function () {
            function DriverBleat() {
            }
            //simple wrapper for bleat characteristic functions
            DriverBleat.prototype.getCharacteristic = function (serviceUid, characteristicUid) {
                var service = this._device.services[serviceUid];
                if (service) {
                    var found = service.characteristics[characteristicUid];
                    if (found)
                        return found;
                    else
                        throw "characteristics " + characteristicUid + " not found in service " + serviceUid;
                }
                else
                    throw "service " + serviceUid + " not found";
            };
            DriverBleat.prototype.connect = function (device, disconnectFn) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    try {
                        var newDevice = device._internalDevice;
                        newDevice.connect(function () {
                            _this._device = newDevice;
                            resolve();
                        }, disconnectFn, false, function (e) {
                            reject(e);
                        });
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            };
            DriverBleat.prototype.disconnect = function () {
                if (this._device)
                    this._device.disconnect();
            };
            DriverBleat.prototype.startScan = function (foundFn) {
                return new Promise(function (resolve, reject) {
                    try {
                        bleat.startScan(function (device) {
                            foundFn({
                                address: device.address,
                                name: device.name,
                                rssi: device.adData.rssi,
                                _internalDevice: device
                            });
                        }, reject);
                        resolve();
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            };
            DriverBleat.prototype.stopScan = function () {
                return new Promise(function (resolve, reject) {
                    try {
                        bleat.stopScan(reject);
                        resolve();
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            };
            DriverBleat.prototype.writeCharacteristic = function (serviceUIID, characteristicUUID, data) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    try {
                        var dataView = new DataView(data.buffer);
                        _this.getCharacteristic(serviceUIID, characteristicUUID).write(dataView, resolve, reject);
                        resolve();
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            };
            DriverBleat.prototype.readCharacteristic = function (serviceUIID, characteristicUUID) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    try {
                        _this.getCharacteristic(serviceUIID, characteristicUUID).read(function (data) { resolve(data.buffer); }, reject);
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            };
            DriverBleat.prototype.enableNotification = function (serviceUIID, characteristicUUID, receive) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    try {
                        _this.getCharacteristic(serviceUIID, characteristicUUID).enableNotify(function (data) { receive(data.buffer); }, resolve, reject);
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            };
            DriverBleat.prototype.disableNotification = function (serviceUIID, characteristicUUID) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    try {
                        _this.getCharacteristic(serviceUIID, characteristicUUID).disableNotify(resolve, reject);
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            };
            return DriverBleat;
        }());
        ble.DriverBleat = DriverBleat;
    })(ble = ergometer.ble || (ergometer.ble = {}));
})(ergometer || (ergometer = {}));
/**
 * Created by tijmen on 03/04/2017.
 */
/**
 * Created by tijmen on 01-02-16.
 *
 * see simpleBLE.d.ts for the definitions of the simpleBLE
 * It assumes that there simple ble is already imported as a var named simpleBLE
 *
 */
/**
 * Created by tijmen on 03/04/2017.
 */
/**
 * Created by tijmen on 01-02-16.
 *
 * see simpleBLE.d.ts for the definitions of the simpleBLE
 * It assumes that there simple ble is already imported as a var named simpleBLE
 *
 */
(function (ergometer) {
    var ble;
    (function (ble) {
        var DriverSimpleBLE = /** @class */ (function () {
            function DriverSimpleBLE() {
            }
            DriverSimpleBLE.prototype.connect = function (device, disconnectFn) {
                return new Promise(function (resolve, reject) {
                    //  simpleBLE.connect("");
                });
            };
            DriverSimpleBLE.prototype.disconnect = function () {
                simpleBLE.disconnect();
            };
            DriverSimpleBLE.prototype.startScan = function (foundFn) {
                return new Promise(function (resolve, reject) {
                    //  simpleBLE.scan();
                });
            };
            DriverSimpleBLE.prototype.stopScan = function () {
                return new Promise(function (resolve, reject) {
                });
            };
            DriverSimpleBLE.prototype.writeCharacteristic = function (serviceUIID, characteristicUUID, data) {
                return new Promise(function (resolve, reject) {
                });
            };
            DriverSimpleBLE.prototype.readCharacteristic = function (serviceUIID, characteristicUUID) {
                return new Promise(function (resolve, reject) {
                });
            };
            DriverSimpleBLE.prototype.enableNotification = function (serviceUIID, characteristicUUID, receive) {
                return new Promise(function (resolve, reject) {
                });
            };
            DriverSimpleBLE.prototype.disableNotification = function (serviceUIID, characteristicUUID) {
                return new Promise(function (resolve, reject) {
                });
            };
            return DriverSimpleBLE;
        }());
        ble.DriverSimpleBLE = DriverSimpleBLE;
    })(ble = ergometer.ble || (ergometer.ble = {}));
})(ergometer || (ergometer = {}));
/**
 * Created by tijmen on 17-07-16.
 */
/**
 * Created by tijmen on 01-02-16.
 */
/**
 * Created by tijmen on 17-07-16.
 */
/**
 * Created by tijmen on 01-02-16.
 */
(function (ergometer) {
    var ble;
    (function (ble) {
        function hasWebBlueTooth() {
            return (navigator && typeof navigator.bluetooth !== 'undefined');
        }
        ble.hasWebBlueTooth = hasWebBlueTooth;
        var DriverWebBlueTooth = /** @class */ (function () {
            function DriverWebBlueTooth(performanceMonitor) {
                this._listenerMap = {};
                //needed to prevent early free of the characteristic
                this._listerCharacteristicMap = {};
                this._performanceMonitor = performanceMonitor;
            }
            //simple wrapper for bleat characteristic functions
            DriverWebBlueTooth.prototype.getCharacteristic = function (serviceUid, characteristicUid) {
                var _this = this;
                if (this._performanceMonitor.logLevel == ergometer.LogLevel.trace)
                    this._performanceMonitor.traceInfo("getCharacteristic " + characteristicUid + " ");
                return new Promise(function (resolve, reject) {
                    if (!_this._server || !_this._server.connected)
                        reject("server not connected");
                    else
                        _this._server.getPrimaryService(serviceUid)
                            .then(function (service) {
                                return service.getCharacteristic(characteristicUid);
                            })
                            .then(resolve, reject);
                });
            };
            DriverWebBlueTooth.prototype.onDisconnected = function (event) {
                if (this._performanceMonitor.logLevel == ergometer.LogLevel.trace)
                    this._performanceMonitor.traceInfo("onDisconnected ");
                if (this._disconnectFn)
                    this._disconnectFn();
                this.clearConnectionVars();
            };
            DriverWebBlueTooth.prototype.clearConnectionVars = function () {
                if (this._performanceMonitor.logLevel == ergometer.LogLevel.trace)
                    this._performanceMonitor.traceInfo("clearConnectionVars ");
                if (this._device)
                    this._device.removeEventListener('ongattserverdisconnected', this.onDisconnected);
                this._device = null;
                this._server = null;
                this._disconnectFn = null;
                this._listenerMap = {};
                this._listerCharacteristicMap = {};
            };
            DriverWebBlueTooth.prototype.connect = function (device, disconnectFn) {
                var _this = this;
                if (this._performanceMonitor.logLevel == ergometer.LogLevel.trace)
                    this._performanceMonitor.traceInfo("connect ");
                return new Promise(function (resolve, reject) {
                    try {
                        var newDevice = device._internalDevice;
                        newDevice.gatt.connect().then(function (server) {
                            _this._device = newDevice;
                            _this._server = server;
                            _this._disconnectFn = disconnectFn;
                            newDevice.addEventListener('ongattserverdisconnected', _this.onDisconnected.bind(_this));
                            resolve();
                        }, reject);
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            };
            DriverWebBlueTooth.prototype.disconnect = function () {
                if (this._performanceMonitor.logLevel == ergometer.LogLevel.trace)
                    this._performanceMonitor.traceInfo("disconnect ");
                if (this._server && this._server.connected)
                    this._server.disconnect();
                else
                    this.clearConnectionVars();
            };
            DriverWebBlueTooth.prototype.startScan = function (foundFn) {
                if (this._performanceMonitor.logLevel == ergometer.LogLevel.trace)
                    this._performanceMonitor.traceInfo("startScan ");
                return new Promise(function (resolve, reject) {
                    try {
                        navigator.bluetooth.requestDevice({
                            filters: [
                                {
                                    services: [ble.PMDEVICE]
                                }
                            ],
                            optionalServices: [ble.PMDEVICE_INFO_SERVICE, ble.PMCONTROL_SERVICE, ble.PMROWING_SERVICE]
                        }).then(function (device) {
                            foundFn({
                                address: device.id,
                                name: device.name,
                                rssi: ((typeof device.adData !== 'undefined') && device.adData.rssi) ? device.adData.rssi : 0,
                                _internalDevice: device
                            });
                        }).then(resolve, reject);
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            };
            DriverWebBlueTooth.prototype.stopScan = function () {
                if (this._performanceMonitor.logLevel == ergometer.LogLevel.trace)
                    this._performanceMonitor.traceInfo("stopScan ");
                if (typeof navigator.bluetooth.cancelRequest !== 'undefined')
                    return navigator.bluetooth.cancelRequest();
                else
                    return new Promise(function (resolve, reject) {
                        resolve();
                    });
            };
            /*
            public writeCharacteristic(serviceUIID : string,characteristicUUID:string, data:ArrayBufferView) : Promise<void> {
              if (this._performanceMonitor.logLevel==LogLevel.trace)
                this._performanceMonitor.traceInfo(`writeCharacteristic ${characteristicUUID} : ${data} `);

              //run read and write one at a time , wait for the result and then call the next
              //this is a workaround for a problem of web blue tooth
              //not yet tested!
              return this._functionQueue.add(
                  this.doWriteCharacteristic,
                  this,serviceUIID,characteristicUUID,data);
            }
            */
            DriverWebBlueTooth.prototype.writeCharacteristic = function (serviceUIID, characteristicUUID, data) {
                var _this = this;
                if (this._performanceMonitor.logLevel == ergometer.LogLevel.trace)
                    this._performanceMonitor.traceInfo("writeCharacteristic " + characteristicUUID + " : " + data + " ");
                return new Promise(function (resolve, reject) {
                    try {
                        _this.getCharacteristic(serviceUIID, characteristicUUID)
                            .then(function (characteristic) {
                                return characteristic.writeValue(data.buffer);
                            })
                            .then(resolve, reject);
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            };
            /*
            public readCharacteristic(serviceUIID : string,characteristicUUID:string) : Promise<ArrayBuffer> {
              if (this._performanceMonitor.logLevel==LogLevel.trace)
                this._performanceMonitor.traceInfo(`readCharacteristic ${characteristicUUID}  `);

              //run read and write one at a time , wait for the result and then call the next
              //this is a workaround for a problem of web blue tooth
              //not yet tested!
              return this._functionQueue.add(
                  this.doReadCharacteristic,
                  this,serviceUIID,characteristicUUID);
            }
            */
            DriverWebBlueTooth.prototype.readCharacteristic = function (serviceUIID, characteristicUUID) {
                var _this = this;
                if (this._performanceMonitor.logLevel == ergometer.LogLevel.trace)
                    this._performanceMonitor.traceInfo("readCharacteristic " + characteristicUUID + "  ");
                return new Promise(function (resolve, reject) {
                    try {
                        _this.getCharacteristic(serviceUIID, characteristicUUID)
                            .then(function (characteristic) {
                                return characteristic.readValue();
                            })
                            .then(function (data) {
                                if (_this._performanceMonitor.logLevel == ergometer.LogLevel.trace)
                                    _this._performanceMonitor.traceInfo("doReadCharacteristic " + characteristicUUID + " : " + ergometer.utils.typedArrayToHexString(data.buffer) + " ");
                                resolve(data.buffer);
                            }, reject);
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            };
            DriverWebBlueTooth.prototype.onCharacteristicValueChanged = function (event) {
                if (this._performanceMonitor.logLevel == ergometer.LogLevel.trace)
                    this._performanceMonitor.traceInfo("onCharacteristicValueChanged " + event.target.uuid + " : " + ergometer.utils.typedArrayToHexString(event.target.value.buffer) + " ");
                try {
                    var func = this._listenerMap[event.target.uuid];
                    if (func)
                        func(event.target.value.buffer);
                }
                catch (e) {
                    if (this._performanceMonitor)
                        this._performanceMonitor.handleError(e.toString());
                    else
                        throw e;
                }
            };
            /*private onCharacteristicValueChanged(uuid,buffer) : Promise<void> {
              return new Promise<void>((resolve, reject) => {
                try {
                  let func=this._listerMap[uuid];
                  if (func) {
                      func(buffer);
                      resolve();
                  }
                  else throw "characteristics uuid "+uuid.toString()+" not found in map";
                }
                catch(e) {
                  if (this._performanceMonitor)
                    this._performanceMonitor.handleError(e.toString());
                  reject(e);
                }

              });
            }

            private onCharacteristicValueChanged(event:webbluetooth.CharacteristicsValueChangedEvent) {
              if (this._performanceMonitor.logLevel==LogLevel.trace)
                this._performanceMonitor.traceInfo(`onCharacteristicValueChanged ${event.target.uuid} : ${utils.typedArrayToHexString(event.target.value.buffer)} `);
              //this may prevent hanging, just a test
                //process one at a time to prevent dead locks
              this._functionQueue.add(
                    this.doOnCharacteristicValueChanged,this,event.target.uuid,event.target.value.buffer);

              return true;
            }
            */
            DriverWebBlueTooth.prototype.enableNotification = function (serviceUIID, characteristicUUID, receive) {
                var _this = this;
                if (this._performanceMonitor.logLevel == ergometer.LogLevel.trace)
                    this._performanceMonitor.traceInfo("enableNotification " + characteristicUUID + "  ");
                return new Promise(function (resolve, reject) {
                    try {
                        _this.getCharacteristic(serviceUIID, characteristicUUID)
                            .then(function (characteristic) {
                                return characteristic.startNotifications().then(function (_) {
                                    _this._listenerMap[characteristicUUID] = receive;
                                    //bug fix: this prevents the chracteristic from being free-ed
                                    _this._listerCharacteristicMap[characteristicUUID] = characteristic;
                                    characteristic.addEventListener('characteristicvaluechanged', _this.onCharacteristicValueChanged.bind(_this));
                                    resolve();
                                }, reject);
                            }).then(resolve, reject);
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            };
            DriverWebBlueTooth.prototype.disableNotification = function (serviceUIID, characteristicUUID) {
                var _this = this;
                //only disable when receive is
                if (this._performanceMonitor.logLevel == ergometer.LogLevel.trace)
                    this._performanceMonitor.traceInfo("disableNotification " + characteristicUUID + "  ");
                return new Promise(function (resolve, reject) {
                    try {
                        if (typeof _this._listenerMap[characteristicUUID] !== 'undefined' && _this._listenerMap[characteristicUUID]) {
                            _this.getCharacteristic(serviceUIID, characteristicUUID)
                                .then(function (characteristic) {
                                    characteristic.stopNotifications().then(function () {
                                        _this._listenerMap[characteristic.uuid] = null;
                                        _this._listerCharacteristicMap[characteristic.uuid] = null;
                                        characteristic.removeEventListener('characteristicvaluechanged', _this.onCharacteristicValueChanged);
                                        resolve();
                                    }, reject);
                                });
                        }
                        else
                            resolve(); //just resolve nothing to do
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            };
            return DriverWebBlueTooth;
        }());
        ble.DriverWebBlueTooth = DriverWebBlueTooth;
    })(ble = ergometer.ble || (ergometer.ble = {}));
})(ergometer || (ergometer = {}));
/**
 * Created by tijmen on 16-02-16.
 */
/**
 * Created by tijmen on 16-02-16.
 */
(function (ergometer) {
    var ble;
    (function (ble) {
        var RecordingEventType;
        (function (RecordingEventType) {
            RecordingEventType[RecordingEventType["startScan"] = 0] = "startScan";
            RecordingEventType[RecordingEventType["scanFoundFn"] = 1] = "scanFoundFn";
            RecordingEventType[RecordingEventType["stopScan"] = 2] = "stopScan";
            RecordingEventType[RecordingEventType["connect"] = 3] = "connect";
            RecordingEventType[RecordingEventType["disconnectFn"] = 4] = "disconnectFn";
            RecordingEventType[RecordingEventType["disconnect"] = 5] = "disconnect";
            RecordingEventType[RecordingEventType["writeCharacteristic"] = 6] = "writeCharacteristic";
            RecordingEventType[RecordingEventType["readCharacteristic"] = 7] = "readCharacteristic";
            RecordingEventType[RecordingEventType["enableNotification"] = 8] = "enableNotification";
            RecordingEventType[RecordingEventType["notificationReceived"] = 9] = "notificationReceived";
            RecordingEventType[RecordingEventType["disableNotification"] = 10] = "disableNotification";
        })(RecordingEventType = ble.RecordingEventType || (ble.RecordingEventType = {}));
        var RecordingDriver = /** @class */ (function () {
            function RecordingDriver(performanceMonitor, realDriver) {
                this._events = [];
                this._performanceMonitor = performanceMonitor;
                this._realDriver = realDriver;
            }
            RecordingDriver.prototype.getRelativeTime = function () {
                return ergometer.utils.getTime() - this._startTime;
            };
            RecordingDriver.prototype.addRecording = function (eventType, data) {
                var newRec = {
                    timeStamp: this.getRelativeTime(),
                    eventType: RecordingEventType[eventType]
                };
                if (data) {
                    newRec.data = data;
                }
                this._events.push(newRec);
                return newRec;
            };
            Object.defineProperty(RecordingDriver.prototype, "events", {
                get: function () {
                    return this._events;
                },
                set: function (value) {
                    this._events = value;
                },
                enumerable: true,
                configurable: true
            });
            RecordingDriver.prototype.clear = function () {
                this._events = [];
            };
            RecordingDriver.prototype.startRecording = function () {
                this.clear();
                this._startTime = ergometer.utils.getTime();
            };
            RecordingDriver.prototype.recordResolveFunc = function (resolve, rec) {
                var _this = this;
                return function () {
                    rec.timeStampReturn = _this.getRelativeTime();
                    resolve();
                };
            };
            RecordingDriver.prototype.recordResolveBufferFunc = function (resolve, rec) {
                var _this = this;
                return function (data) {
                    rec.timeStampReturn = _this.getRelativeTime();
                    rec.data.data = ergometer.utils.typedArrayToHexString(data);
                    resolve(data);
                };
            };
            RecordingDriver.prototype.recordErrorFunc = function (reject, rec) {
                var _this = this;
                return function (e) {
                    rec.timeStampReturn = _this.getRelativeTime();
                    rec.error = e;
                    reject(e);
                };
            };
            RecordingDriver.prototype.startScan = function (foundFn) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    var rec = _this.addRecording(RecordingEventType.startScan);
                    _this._realDriver.startScan(function (device) {
                        _this.addRecording(RecordingEventType.scanFoundFn, {
                            address: device.address,
                            name: device.name,
                            rssi: device.rssi
                        });
                        foundFn(device);
                    })
                        .then(_this.recordResolveFunc(resolve, rec), _this.recordErrorFunc(reject, rec));
                });
            };
            RecordingDriver.prototype.stopScan = function () {
                this.addRecording(RecordingEventType.stopScan);
                this._realDriver.stopScan();
            };
            RecordingDriver.prototype.connect = function (device, disconnectFn) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    var rec = _this.addRecording(RecordingEventType.connect);
                    _this._realDriver.connect(device, function () {
                        _this.addRecording(RecordingEventType.disconnectFn);
                        disconnectFn();
                    }).then(_this.recordResolveFunc(resolve, rec), _this.recordErrorFunc(reject, rec));
                });
            };
            RecordingDriver.prototype.disconnect = function () {
                this.addRecording(RecordingEventType.disconnect);
                this._realDriver.disconnect();
            };
            RecordingDriver.prototype.writeCharacteristic = function (serviceUIID, characteristicUUID, data) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    var rec = _this.addRecording(RecordingEventType.writeCharacteristic, {
                        serviceUIID: serviceUIID,
                        characteristicUUID: characteristicUUID,
                        data: ergometer.utils.typedArrayToHexString(data.buffer)
                    });
                    _this._realDriver.writeCharacteristic(serviceUIID, characteristicUUID, data)
                        .then(_this.recordResolveFunc(resolve, rec), _this.recordErrorFunc(reject, rec));
                });
            };
            RecordingDriver.prototype.readCharacteristic = function (serviceUIID, characteristicUUID) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    var rec = _this.addRecording(RecordingEventType.readCharacteristic, {
                        serviceUIID: serviceUIID,
                        characteristicUUID: characteristicUUID
                    });
                    _this._realDriver.readCharacteristic(serviceUIID, characteristicUUID)
                        .then(_this.recordResolveBufferFunc(resolve, rec), _this.recordErrorFunc(reject, rec));
                });
            };
            RecordingDriver.prototype.enableNotification = function (serviceUIID, characteristicUUID, receive) {
                /*
                //make a wrapper for each call otherwise it returns the
                class ReturnWrapper {

                    constructor (private serviceUIID,private characteristicUUID,private receive,private driver)  {

                    }
                    public getReturnFunc() {
                        return (data:ArrayBuffer) => {
                        this.driver.addRecording(RecordingEventType.notificationReceived,{
                            serviceUIID:this.serviceUIID,
                            characteristicUUID:this.characteristicUUID,
                            data:utils.typedArrayToHexString(data)});
                        this.receive(data);
                    }
                }
                }
                var receivedWrapper = new ReturnWrapper(serviceUIID,characteristicUUID,receive,this);
                */
                var _this = this;
                return new Promise(function (resolve, reject) {
                    var rec = _this.addRecording(RecordingEventType.enableNotification, {
                        serviceUIID: serviceUIID,
                        characteristicUUID: characteristicUUID
                    });
                    _this._realDriver.enableNotification(serviceUIID, characteristicUUID, function (data) {
                        _this.addRecording(RecordingEventType.notificationReceived, {
                            serviceUIID: serviceUIID,
                            characteristicUUID: characteristicUUID,
                            data: ergometer.utils.typedArrayToHexString(data)
                        });
                        receive(data);
                    })
                        .then(_this.recordResolveFunc(resolve, rec), _this.recordErrorFunc(reject, rec));
                });
            };
            RecordingDriver.prototype.disableNotification = function (serviceUIID, characteristicUUID) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    var rec = _this.addRecording(RecordingEventType.disableNotification, {
                        serviceUIID: serviceUIID,
                        characteristicUUID: characteristicUUID
                    });
                    _this._realDriver.disableNotification(serviceUIID, characteristicUUID)
                        .then(_this.recordResolveFunc(resolve, rec), _this.recordErrorFunc(reject, rec));
                });
            };
            return RecordingDriver;
        }());
        ble.RecordingDriver = RecordingDriver;
    })(ble = ergometer.ble || (ergometer.ble = {}));
})(ergometer || (ergometer = {}));
/**
 * Created by tijmen on 18-02-16.
 */
/**
 * Created by tijmen on 18-02-16.
 */
(function (ergometer) {
    var ble;
    (function (ble) {
        var ReplayDriver = /** @class */ (function () {
            function ReplayDriver(performanceMonitor, realDriver) {
                this._events = [];
                this._eventCallBackMethods = [];
                this._eventCallbacks = [];
                this._playing = false;
                this._eventIndex = 0;
                this._checkQueueTimerId = null;
                this._performanceMonitor = performanceMonitor;
                this._realDriver = realDriver;
            }
            ReplayDriver.prototype.getRelativeTime = function () {
                return ergometer.utils.getTime() - this._startTime;
            };
            Object.defineProperty(ReplayDriver.prototype, "events", {
                get: function () {
                    return this._events;
                },
                enumerable: true,
                configurable: true
            });
            ReplayDriver.prototype.isCallBack = function (eventType) {
                return (eventType == ble.RecordingEventType.scanFoundFn ||
                    eventType == ble.RecordingEventType.disconnectFn ||
                    eventType == ble.RecordingEventType.notificationReceived);
            };
            ReplayDriver.prototype.isSameEvent = function (event1, event2) {
                var result = event1.eventType == event2.eventType;
                if (result && ergometer.utils.isDefined(event1.data) && ergometer.utils.isDefined(event2.data) && event1.data && event2.data) {
                    var data1 = event1.data;
                    var data2 = event2.data;
                    if (result && (ergometer.utils.isDefined(data1.serviceUIID) || ergometer.utils.isDefined(data2.serviceUIID)))
                        result = data1.serviceUIID == data2.serviceUIID;
                    if (result && (ergometer.utils.isDefined(data1.characteristicUUID) || ergometer.utils.isDefined(data2.characteristicUUID)))
                        result = data1.characteristicUUID == data2.characteristicUUID;
                }
                return result;
            };
            ReplayDriver.prototype.runEvent = function (event, queuedEvent) {
                if (this._performanceMonitor.logLevel >= ergometer.LogLevel.trace)
                    this._performanceMonitor.traceInfo("run event:" + JSON.stringify(event));
                if (event.error) {
                    queuedEvent.reject(event.error);
                }
                else {
                    var data = null;
                    if (event.data) {
                        data = event.data;
                        var eventType = ble.RecordingEventType[event.eventType];
                        if (eventType == ble.RecordingEventType.readCharacteristic ||
                            eventType == ble.RecordingEventType.notificationReceived) {
                            data = ergometer.utils.hexStringToTypedArray(data.data).buffer;
                        }
                    }
                    if (queuedEvent.resolve) {
                        try {
                            if (data)
                                queuedEvent.resolve(data);
                            else
                                queuedEvent.resolve();
                        }
                        catch (e) {
                            //do not let it stop on replay errors, just continue and log
                            this._performanceMonitor.handleError("Error: while replaying event" + e);
                        }
                    }
                }
            };
            ReplayDriver.prototype.runTimedEvent = function (event, queuedEvent) {
                var _this = this;
                setTimeout(function () {
                    _this.runEvent(event, queuedEvent);
                }, queuedEvent.timeStamp - event.timeStamp);
            };
            ReplayDriver.prototype.removeEvent = function (i) {
                this._events.splice(i, 1);
            };
            ReplayDriver.prototype.checkQueue = function () {
                var _this = this;
                var keepChecking = true;
                while (keepChecking && this._events.length > 0 && this._events[0].timeStamp <= this.getRelativeTime()) {
                    keepChecking = false; //by default do not keep on checking
                    var event = this._events[0];
                    if (this.isCallBack(ble.RecordingEventType[event.eventType])) {
                        //run call backs directly on the given time
                        if (event.timeStamp <= this.getRelativeTime()) {
                            var found = false;
                            this._eventCallbacks.forEach(function (callbackEvent) {
                                if (_this.isSameEvent(event, callbackEvent)) {
                                    _this.runEvent(event, callbackEvent);
                                    keepChecking = true;
                                    found = true;
                                }
                            });
                            if (found)
                                this.removeEvent(0);
                        }
                    }
                    else {
                        if (this._eventCallBackMethods.length > 0) {
                            for (var i = 0; i < this._eventCallBackMethods.length; i++) {
                                var eventQueued = this._eventCallBackMethods[i];
                                if (this.isSameEvent(eventQueued, event)) {
                                    this._eventCallBackMethods.splice(i, 1);
                                    this.removeEvent(0);
                                    keepChecking = true;
                                    if (event.timeStamp <= eventQueued.timeStamp)
                                        this.runEvent(event, eventQueued);
                                    else
                                        this.runTimedEvent(event, eventQueued);
                                    break;
                                }
                            }
                        }
                    }
                }
                if (this._events.length > 0) {
                    var event_1 = this._events[0];
                    this.timeNextCheck(event_1.timeStamp);
                }
                this.checkAllEventsProcessd();
            };
            ReplayDriver.prototype.checkAllEventsProcessd = function () {
                var allDone = (this.events.length == 0) && (this._eventCallBackMethods.length == 0);
                if (allDone && this.playing) {
                    this.playing = false;
                }
                return allDone;
            };
            ReplayDriver.prototype.timeNextCheck = function (timeStamp) {
                var _this = this;
                if (this._checkQueueTimerId) {
                    window.clearTimeout(this._checkQueueTimerId);
                    this._checkQueueTimerId = null;
                }
                var duration = 0;
                if (timeStamp) {
                    duration = this.getRelativeTime() - timeStamp;
                    if (duration == 0)
                        duration = 100;
                }
                this._checkQueueTimerId = setTimeout(function () {
                    _this.checkQueue();
                }, duration);
            };
            ReplayDriver.prototype.addEvent = function (eventType, isMethod, resolve, reject, serviceUIID, characteristicUUID) {
                var event = {
                    timeStamp: this.getRelativeTime(),
                    eventType: ble.RecordingEventType[eventType]
                };
                if (resolve)
                    event.resolve = resolve;
                if (reject)
                    event.reject = reject;
                if (serviceUIID || characteristicUUID) {
                    var data = {
                        serviceUIID: serviceUIID,
                        characteristicUUID: characteristicUUID
                    };
                    event.data = data;
                }
                if (isMethod) {
                    this._eventCallBackMethods.push(event);
                }
                else {
                    this._eventCallbacks.push(event);
                    this.timeNextCheck();
                }
            };
            ReplayDriver.prototype.replay = function (events) {
                this._playing = false;
                this._startTime = ergometer.utils.getTime();
                this._events = events;
                this._eventIndex = 0;
                this.playing = true;
            };
            Object.defineProperty(ReplayDriver.prototype, "playing", {
                get: function () {
                    return this._playing;
                },
                set: function (value) {
                    if (this._playing != value) {
                        this._playing = value;
                        if (!value) {
                            this._eventCallBackMethods = [];
                            this._eventCallbacks = [];
                            this._performanceMonitor.disconnect();
                        }
                    }
                },
                enumerable: true,
                configurable: true
            });
            /*protected  playEvent(event : IRecordingItem) : Promise<void> {

                    var timeDiff = event.timeStamp-event.timeStampReturn;
                    if (event.error)  setTimeout(reject, timeDiff)
                    else setTimeout(resolve, timeDiff);
            }  */
            ReplayDriver.prototype.startScan = function (foundFn) {
                var _this = this;
                this.addEvent(ble.RecordingEventType.scanFoundFn, false, foundFn);
                return new Promise(function (resolve, reject) {
                    _this.addEvent(ble.RecordingEventType.startScan, true, resolve, reject);
                });
            };
            ReplayDriver.prototype.stopScan = function () {
                this.addEvent(ble.RecordingEventType.stopScan, true);
            };
            ReplayDriver.prototype.connect = function (device, disconnectFn) {
                var _this = this;
                this.addEvent(ble.RecordingEventType.disconnectFn, false, disconnectFn);
                return new Promise(function (resolve, reject) {
                    _this.addEvent(ble.RecordingEventType.connect, true, resolve, reject);
                });
            };
            ReplayDriver.prototype.disconnect = function () {
                this.addEvent(ble.RecordingEventType.disconnect, true);
            };
            ReplayDriver.prototype.writeCharacteristic = function (serviceUIID, characteristicUUID, data) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    _this.addEvent(ble.RecordingEventType.writeCharacteristic, true, resolve, reject, serviceUIID, characteristicUUID);
                });
            };
            ReplayDriver.prototype.readCharacteristic = function (serviceUIID, characteristicUUID) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    _this.addEvent(ble.RecordingEventType.readCharacteristic, true, resolve, reject, serviceUIID, characteristicUUID);
                });
            };
            ReplayDriver.prototype.enableNotification = function (serviceUIID, characteristicUUID, receive) {
                var _this = this;
                this.addEvent(ble.RecordingEventType.notificationReceived, false, receive, null, serviceUIID, characteristicUUID);
                return new Promise(function (resolve, reject) {
                    _this.addEvent(ble.RecordingEventType.enableNotification, true, resolve, reject, serviceUIID, characteristicUUID);
                });
            };
            ReplayDriver.prototype.disableNotification = function (serviceUIID, characteristicUUID) {
                var _this = this;
                return new Promise(function (resolve, reject) {
                    _this.addEvent(ble.RecordingEventType.disableNotification, true, resolve, reject, serviceUIID, characteristicUUID);
                });
            };
            return ReplayDriver;
        }());
        ble.ReplayDriver = ReplayDriver;
    })(ble = ergometer.ble || (ergometer.ble = {}));
})(ergometer || (ergometer = {}));
/**
 * Created by tijmen on 16-01-16.
 */
/** @internal */
/**
 * Created by tijmen on 16-01-16.
 */
/** @internal */
(function (ergometer) {
    var ble;
    (function (ble) {
        /** @internal */
        ble.PMDEVICE = "ce060000-43e5-11e4-916c-0800200c9a66";
        // Service UUIDs
        ble.PMDEVICE_INFO_SERVICE = "ce060010-43e5-11e4-916c-0800200c9a66";
        ble.PMCONTROL_SERVICE = "ce060020-43e5-11e4-916c-0800200c9a66";
        ble.PMROWING_SERVICE = "ce060030-43e5-11e4-916c-0800200c9a66";
        // Characteristic UUIDs for PM device info service
        ble.MODELNUMBER_CHARACTERISIC = "ce060011-43e5-11e4-916c-0800200c9a66";
        ble.SERIALNUMBER_CHARACTERISTIC = "ce060012-43e5-11e4-916c-0800200c9a66";
        ble.HWREVISION_CHARACTERISIC = "ce060013-43e5-11e4-916c-0800200c9a66";
        ble.FWREVISION_CHARACTERISIC = "ce060014-43e5-11e4-916c-0800200c9a66";
        ble.MANUFNAME_CHARACTERISIC = "ce060015-43e5-11e4-916c-0800200c9a66";
        ble.MACHINETYPE_CHARACTERISIC = "ce060016-43e5-11e4-916c-0800200c9a66";
        // Characteristic UUIDs for PM control service
        ble.TRANSMIT_TO_PM_CHARACTERISIC = "ce060021-43e5-11e4-916c-0800200c9a66";
        ble.RECEIVE_FROM_PM_CHARACTERISIC = "ce060022-43e5-11e4-916c-0800200c9a66";
        // Characteristic UUIDs for rowing service
        ble.ROWING_STATUS_CHARACTERISIC = "ce060031-43e5-11e4-916c-0800200c9a66";
        ble.EXTRA_STATUS1_CHARACTERISIC = "ce060032-43e5-11e4-916c-0800200c9a66";
        ble.EXTRA_STATUS2_CHARACTERISIC = "ce060033-43e5-11e4-916c-0800200c9a66";
        ble.ROWING_STATUS_SAMPLE_RATE_CHARACTERISIC = "ce060034-43e5-11e4-916c-0800200c9a66";
        ble.STROKE_DATA_CHARACTERISIC = "ce060035-43e5-11e4-916c-0800200c9a66";
        ble.EXTRA_STROKE_DATA_CHARACTERISIC = "ce060036-43e5-11e4-916c-0800200c9a66";
        ble.SPLIT_INTERVAL_DATA_CHARACTERISIC = "ce060037-43e5-11e4-916c-0800200c9a66";
        ble.EXTRA_SPLIT_INTERVAL_DATA_CHARACTERISIC = "ce060038-43e5-11e4-916c-0800200c9a66";
        ble.ROWING_SUMMARY_CHARACTERISIC = "ce060039-43e5-11e4-916c-0800200c9a66";
        ble.EXTRA_ROWING_SUMMARY_CHARACTERISIC = "ce06003a-43e5-11e4-916c-0800200c9a66";
        ble.HEART_RATE_BELT_INFO_CHARACTERISIC = "ce06003b-43e5-11e4-916c-0800200c9a66";
        ble.MULTIPLEXED_INFO_CHARACTERISIC = "ce060080-43e5-11e4-916c-0800200c9a66";
        ble.NOTIFICATION_DESCRIPTOR = "00002902-0000-1000-8000-00805f9b34fb";
        ble.PACKET_SIZE = 20;
        ;
        ;
        ;
    })(ble = ergometer.ble || (ergometer.ble = {}));
})(ergometer || (ergometer = {}));
/**
 * Created by tijmen on 16-01-16.
 *
 * translation of concept 2 csafe.h to typescript version  9/16/08 10:51a
 */
/**
 * Created by tijmen on 16-01-16.
 *
 * translation of concept 2 csafe.h to typescript version  9/16/08 10:51a
 */
(function (ergometer) {
    var csafe;
    (function (csafe) {
        var defs;
        (function (defs) {
            /* Frame contents */
            defs.EXT_FRAME_START_BYTE = 0xF0;
            defs.FRAME_START_BYTE = 0xF1;
            defs.FRAME_END_BYTE = 0xF2;
            defs.FRAME_STUFF_BYTE = 0xF3;
            defs.FRAME_MAX_STUFF_OFFSET_BYTE = 0x03;
            defs.FRAME_FLG_LEN = 2;
            defs.EXT_FRAME_ADDR_LEN = 2;
            defs.FRAME_CHKSUM_LEN = 1;
            defs.SHORT_CMD_TYPE_MSK = 0x80;
            defs.LONG_CMD_HDR_LENGTH = 2;
            defs.LONG_CMD_BYTE_CNT_OFFSET = 1;
            defs.RSP_HDR_LENGTH = 2;
            defs.FRAME_STD_TYPE = 0;
            defs.FRAME_EXT_TYPE = 1;
            defs.DESTINATION_ADDR_HOST = 0x00;
            defs.DESTINATION_ADDR_ERG_MASTER = 0x01;
            defs.DESTINATION_ADDR_BROADCAST = 0xFF;
            defs.DESTINATION_ADDR_ERG_DEFAULT = 0xFD;
            defs.FRAME_MAXSIZE = 96;
            defs.INTERFRAMEGAP_MIN = 50; // msec
            defs.CMDUPLIST_MAXSIZE = 10;
            defs.MEMORY_BLOCKSIZE = 64;
            defs.FORCEPLOT_BLOCKSIZE = 32;
            defs.HEARTBEAT_BLOCKSIZE = 32;
            /* Manufacturer Info */
            defs.MANUFACTURE_ID = 22; // assigned by Fitlinxx for Concept2
            defs.CLASS_ID = 2; // standard CSAFE equipment
            defs.MODEL_NUM = 5; // PM4
            defs.UNITS_TYPE = 0; // Metric
            defs.SERIALNUM_DIGITS = 9;
            defs.HMS_FORMAT_CNT = 3;
            defs.YMD_FORMAT_CNT = 3;
            defs.ERRORCODE_FORMAT_CNT = 3;
            /* Command space partitioning for standard commands */
            defs.CTRL_CMD_LONG_MIN = 0x01;
            defs.CFG_CMD_LONG_MIN = 0x10;
            defs.DATA_CMD_LONG_MIN = 0x20;
            defs.AUDIO_CMD_LONG_MIN = 0x40;
            defs.TEXTCFG_CMD_LONG_MIN = 0x60;
            defs.TEXTSTATUS_CMD_LONG_MIN = 0x65;
            defs.CAP_CMD_LONG_MIN = 0x70;
            defs.PMPROPRIETARY_CMD_LONG_MIN = 0x76;
            defs.CTRL_CMD_SHORT_MIN = 0x80;
            defs.STATUS_CMD_SHORT_MIN = 0x91;
            defs.DATA_CMD_SHORT_MIN = 0xA0;
            defs.AUDIO_CMD_SHORT_MIN = 0xC0;
            defs.TEXTCFG_CMD_SHORT_MIN = 0xE0;
            defs.TEXTSTATUS_CMD_SHORT_MIN = 0xE5;
            /* Command space partitioning for PM proprietary commands */
            defs.GETPMCFG_CMD_SHORT_MIN = 0x80;
            defs.GETPMCFG_CMD_LONG_MIN = 0x50;
            defs.SETPMCFG_CMD_SHORT_MIN = 0xE0;
            defs.SETPMCFG_CMD_LONG_MIN = 0x00;
            defs.GETPMDATA_CMD_SHORT_MIN = 0xA0;
            defs.GETPMDATA_CMD_LONG_MIN = 0x68;
            defs.SETPMDATA_CMD_SHORT_MIN = 0xD0;
            defs.SETPMDATA_CMD_LONG_MIN = 0x30;
            ;
            /* Status byte flag and mask definitions */
            defs.PREVOK_FLG = 0x00;
            defs.PREVREJECT_FLG = 0x10;
            defs.PREVBAD_FLG = 0x20;
            defs.PREVNOTRDY_FLG = 0x30;
            defs.PREVFRAMESTATUS_MSK = 0x30;
            defs.SLAVESTATE_ERR_FLG = 0x00;
            defs.SLAVESTATE_RDY_FLG = 0x01;
            defs.SLAVESTATE_IDLE_FLG = 0x02;
            defs.SLAVESTATE_HAVEID_FLG = 0x03;
            defs.SLAVESTATE_INUSE_FLG = 0x05;
            defs.SLAVESTATE_PAUSE_FLG = 0x06;
            defs.SLAVESTATE_FINISH_FLG = 0x07;
            defs.SLAVESTATE_MANUAL_FLG = 0x08;
            defs.SLAVESTATE_OFFLINE_FLG = 0x09;
            defs.FRAMECNT_FLG = 0x80;
            defs.SLAVESTATE_MSK = 0x0F;
            /* AUTOUPLOAD_CMD flag definitions */
            defs.AUTOSTATUS_FLG = 0x01;
            defs.UPSTATUS_FLG = 0x02;
            defs.UPLIST_FLG = 0x04;
            defs.ACK_FLG = 0x10;
            defs.EXTERNCONTROL_FLG = 0x40;
            /* CSAFE Slave Capabilities Codes */
            defs.CAPCODE_PROTOCOL = 0x00;
            defs.CAPCODE_POWER = 0x01;
            defs.CAPCODE_TEXT = 0x02;
            /* CSAFE units format definitions: <type>_<unit>_<tens>_<decimals> */
            defs.DISTANCE_MILE_0_0 = 0x01;
            defs.DISTANCE_MILE_0_1 = 0x02;
            defs.DISTANCE_MILE_0_2 = 0x03;
            defs.DISTANCE_MILE_0_3 = 0x04;
            defs.DISTANCE_FEET_0_0 = 0x05;
            defs.DISTANCE_INCH_0_0 = 0x06;
            defs.WEIGHT_LBS_0_0 = 0x07;
            defs.WEIGHT_LBS_0_1 = 0x08;
            defs.DISTANCE_FEET_1_0 = 0x0A;
            defs.SPEED_MILEPERHOUR_0_0 = 0x10;
            defs.SPEED_MILEPERHOUR_0_1 = 0x11;
            defs.SPEED_MILEPERHOUR_0_2 = 0x12;
            defs.SPEED_FEETPERMINUTE_0_0 = 0x13;
            defs.DISTANCE_KM_0_0 = 0x21;
            defs.DISTANCE_KM_0_1 = 0x22;
            defs.DISTANCE_KM_0_2 = 0x23;
            defs.DISTANCE_METER_0_0 = 0x24;
            defs.DISTANCE_METER_0_1 = 0x25;
            defs.DISTANCE_CM_0_0 = 0x26;
            defs.WEIGHT_KG_0_0 = 0x27;
            defs.WEIGHT_KG_0_1 = 0x28;
            defs.SPEED_KMPERHOUR_0_0 = 0x30;
            defs.SPEED_KMPERHOUR_0_1 = 0x31;
            defs.SPEED_KMPERHOUR_0_2 = 0x32;
            defs.SPEED_METERPERMINUTE_0_0 = 0x33;
            defs.PACE_MINUTEPERMILE_0_0 = 0x37;
            defs.PACE_MINUTEPERKM_0_0 = 0x38;
            defs.PACE_SECONDSPERKM_0_0 = 0x39;
            defs.PACE_SECONDSPERMILE_0_0 = 0x3A;
            defs.DISTANCE_FLOORS_0_0 = 0x41;
            defs.DISTANCE_FLOORS_0_1 = 0x42;
            defs.DISTANCE_STEPS_0_0 = 0x43;
            defs.DISTANCE_REVS_0_0 = 0x44;
            defs.DISTANCE_STRIDES_0_0 = 0x45;
            defs.DISTANCE_STROKES_0_0 = 0x46;
            defs.MISC_BEATS_0_0 = 0x47;
            defs.ENERGY_CALORIES_0_0 = 0x48;
            defs.GRADE_PERCENT_0_0 = 0x4A;
            defs.GRADE_PERCENT_0_2 = 0x4B;
            defs.GRADE_PERCENT_0_1 = 0x4C;
            defs.CADENCE_FLOORSPERMINUTE_0_1 = 0x4F;
            defs.CADENCE_FLOORSPERMINUTE_0_0 = 0x50;
            defs.CADENCE_STEPSPERMINUTE_0_0 = 0x51;
            defs.CADENCE_REVSPERMINUTE_0_0 = 0x52;
            defs.CADENCE_STRIDESPERMINUTE_0_0 = 0x53;
            defs.CADENCE_STROKESPERMINUTE_0_0 = 0x54;
            defs.MISC_BEATSPERMINUTE_0_0 = 0x55;
            defs.BURN_CALORIESPERMINUTE_0_0 = 0x56;
            defs.BURN_CALORIESPERHOUR_0_0 = 0x57;
            defs.POWER_WATTS_0_0 = 0x58;
            defs.ENERGY_INCHLB_0_0 = 0x5A;
            defs.ENERGY_FOOTLB_0_0 = 0x5B;
            defs.ENERGY_NM_0_0 = 0x5C;
            /* Conversion constants */
            defs.KG_TO_LBS = 2.2046;
            defs.LBS_TO_KG = (1. / defs.KG_TO_LBS);
            /* ID Digits */
            defs.IDDIGITS_MIN = 2;
            defs.IDDIGITS_MAX = 5;
            defs.DEFAULT_IDDIGITS = 5;
            defs.DEFAULT_ID = 0;
            defs.MANUAL_ID = 999999999;
            /* Slave State Tiimeout Parameters */
            defs.DEFAULT_SLAVESTATE_TIMEOUT = 20; // seconds
            defs.PAUSED_SLAVESTATE_TIMEOUT = 220; // seconds
            defs.INUSE_SLAVESTATE_TIMEOUT = 6; // seconds
            defs.IDLE_SLAVESTATE_TIMEOUT = 30; // seconds
            /* Base Year */
            defs.BASE_YEAR = 1900;
            /* Default time intervals */
            defs.DEFAULT_STATUSUPDATE_INTERVAL = 256; // seconds
            defs.DEFAULT_CMDUPLIST_INTERVAL = 256; // seconds
        })(defs = csafe.defs || (csafe.defs = {}));
    })(csafe = ergometer.csafe || (ergometer.csafe = {}));
})(ergometer || (ergometer = {}));
/**
 * Created by tijmen on 19-01-16.
 *
 * Extensible frame work so you can add your own csafe commands to the buffer
 *
 * this is the core, you do not have to change this code.
 *
 */
/**
 * Created by tijmen on 19-01-16.
 *
 * Extensible frame work so you can add your own csafe commands to the buffer
 *
 * this is the core, you do not have to change this code.
 *
 */
(function (ergometer) {
    var csafe;
    (function (csafe) {
        var CommandManagager = /** @class */ (function () {
            function CommandManagager() {
                this._commands = [];
            }
            CommandManagager.prototype.register = function (createCommand) {
                this._commands.push(createCommand);
            };
            CommandManagager.prototype.apply = function (buffer, monitor) {
                this._commands.forEach(function (command) {
                    command(buffer, monitor);
                });
            };
            return CommandManagager;
        }());
        csafe.CommandManagager = CommandManagager;
        csafe.commandManager = new CommandManagager();
        function registerStandardSet(functionName, command, setParams) {
            csafe.commandManager.register(function (buffer, monitor) {
                buffer[functionName] = function (params) {
                    buffer.addRawCommand({
                        waitForResponse: false,
                        command: command,
                        data: setParams(params),
                        onError: params.onError
                    });
                    return buffer;
                };
            });
        }
        csafe.registerStandardSet = registerStandardSet;
        function registerStandardSetConfig(functionName, command, setParams) {
            csafe.commandManager.register(function (buffer, monitor) {
                buffer[functionName] = function (params) {
                    buffer.addRawCommand({
                        waitForResponse: false,
                        command: 26 /* SETUSERCFG1_CMD */,
                        detailCommand: command,
                        data: setParams(params),
                        onError: params.onError
                    });
                    return buffer;
                };
            });
        }
        csafe.registerStandardSetConfig = registerStandardSetConfig;
        function registerStandardShortGet(functionName, command, converter) {
            csafe.commandManager.register(function (buffer, monitor) {
                buffer[functionName] = function (params) {
                    buffer.addRawCommand({
                        waitForResponse: true,
                        command: command,
                        onDataReceived: function (data) { params.onDataReceived(converter(data)); },
                        onError: params.onError
                    });
                    return buffer;
                };
            });
        }
        csafe.registerStandardShortGet = registerStandardShortGet;
    })(csafe = ergometer.csafe || (ergometer.csafe = {}));
})(ergometer || (ergometer = {}));
/**
 * Created by tijmen on 19-01-16.
 *
 * Extensible frame work so you can add your own csafe commands to the buffer
 *
 */
/**
 * Created by tijmen on 19-01-16.
 *
 * Extensible frame work so you can add your own csafe commands to the buffer
 *
 */
(function (ergometer) {
    var csafe;
    (function (csafe) {
        //----------------------------- get the stoke state ------------------------------------
        csafe.commandManager.register(function (buffer, monitor) {
            buffer.getStrokeState = function (params) {
                buffer.addRawCommand({
                    waitForResponse: true,
                    command: 26 /* SETUSERCFG1_CMD */,
                    detailCommand: 191 /* PM_GET_STROKESTATE */,
                    onDataReceived: function (data) {
                        if (params.onDataReceived)
                            params.onDataReceived(data.getUint8(0));
                    },
                    onError: params.onError
                });
                return buffer;
            };
        });
        csafe.commandManager.register(function (buffer, monitor) {
            var receivePowerCurvePart = [];
            var currentPowerCurve = [];
            buffer.getPowerCurve = function (params) {
                buffer.addRawCommand({
                    waitForResponse: true,
                    command: 26 /* SETUSERCFG1_CMD */,
                    detailCommand: 107 /* PM_GET_FORCEPLOTDATA */,
                    data: [20],
                    onError: params.onError,
                    onDataReceived: function (data) {
                        if (params.onDataReceived) {
                            var bytesReturned = data.getUint8(0); //first byte
                            monitor.traceInfo("received power curve count " + bytesReturned);
                            if (bytesReturned > 0) {
                                for (var i = 1; i < bytesReturned + 1; i += 2) {
                                    var value = data.getUint16(i, true); //in ltile endian format
                                    receivePowerCurvePart.push(value);
                                }
                                monitor.traceInfo("received part :" + JSON.stringify(receivePowerCurvePart));
                                //try to get another one till it is empty and there is nothing more
                                buffer.clear().getPowerCurve({ onDataReceived: params.onDataReceived }).send();
                            }
                            else {
                                if (receivePowerCurvePart.length > 0) {
                                    currentPowerCurve = receivePowerCurvePart;
                                    receivePowerCurvePart = [];
                                    monitor.traceInfo("Curve:" + JSON.stringify(currentPowerCurve));
                                    if (params.onDataReceived && currentPowerCurve.length > 0)
                                        params.onDataReceived(currentPowerCurve);
                                }
                            }
                        }
                    }
                });
                return buffer;
            };
        });
        csafe.registerStandardSet("setProgram", 36 /* SETPROGRAM_CMD */, function (params) { return [ergometer.utils.getByte(params.value, 0), 0]; });
        csafe.registerStandardSet("setTime", 17 /* SETTIME_CMD */, function (params) { return [params.hour, params.minute, params.second]; });
        csafe.registerStandardSet("setDate", 18 /* SETDATE_CMD */, function (params) { return [ergometer.utils.getByte(params.year, 0), params.month, params.day]; });
        csafe.registerStandardSet("setTimeout", 19 /* SETTIMEOUT_CMD */, function (params) { return [params.value]; });
        csafe.registerStandardSet("setWork", 32 /* SETTWORK_CMD */, function (params) { return [params.hour, params.minute, params.second]; });
        csafe.registerStandardSet("setDistance", 33 /* SETHORIZONTAL_CMD */, function (params) { return [ergometer.utils.getByte(params.value, 0), ergometer.utils.getByte(params.value, 1), params.unit]; });
        csafe.registerStandardSet("setTotalCalories", 35 /* SETCALORIES_CMD */, function (params) { return [ergometer.utils.getByte(params.value, 0), ergometer.utils.getByte(params.value, 1)]; });
        csafe.registerStandardSet("setPower", 52 /* SETPOWER_CMD */, function (params) { return [ergometer.utils.getByte(params.value, 0), ergometer.utils.getByte(params.value, 1), params.unit]; });
    })(csafe = ergometer.csafe || (ergometer.csafe = {}));
})(ergometer || (ergometer = {}));
/**
 * Created by tijmen on 19-01-16.
 *
 * Extensible frame work so you can add your own csafe commands to the buffer
 *
 */
/**
 * Created by tijmen on 19-01-16.
 *
 * Extensible frame work so you can add your own csafe commands to the buffer
 *
 */
(function (ergometer) {
    var csafe;
    (function (csafe) {
        //----------------------------- get the version info ------------------------------------
        csafe.commandManager.register(function (buffer, monitor) {
            buffer.getVersion = function (params) {
                buffer.addRawCommand({
                    waitForResponse: true,
                    command: 145 /* GETVERSION_CMD */,
                    onDataReceived: function (data) {
                        if (params.onDataReceived)
                            params.onDataReceived({
                                ManufacturerId: data.getUint8(0),
                                CID: data.getUint8(1),
                                Model: data.getUint8(2),
                                HardwareVersion: data.getUint16(3, true),
                                FirmwareVersion: data.getUint16(5, true)
                            });
                    },
                    onError: params.onError
                });
                return buffer;
            };
        });
        csafe.registerStandardShortGet("getDistance", 161 /* GETHORIZONTAL_CMD */, function (data) { return { value: data.getUint16(0, true), unit: data.getUint8(2) }; });
    })(csafe = ergometer.csafe || (ergometer.csafe = {}));
})(ergometer || (ergometer = {}));
/**
 * Created by tijmen on 06-02-16.
 */
/**
 * Created by tijmen on 06-02-16.
 */
(function (ergometer) {
    var csafe;
    (function (csafe) {
        //----------------------------- workout type ------------------------------------
        csafe.registerStandardSetConfig("setWorkoutType", 1 /* PM_SET_WORKOUTTYPE */, function (params) { return [params.value]; });
    })(csafe = ergometer.csafe || (ergometer.csafe = {}));
})(ergometer || (ergometer = {}));
/**
 * Concept 2 ergometer Performance Monitor api for Cordova
 *
 * This will will work with the PM5
 *
 * Created by tijmen on 01-06-15.
 * License:
 *
 * Copyright 2016 Tijmen van Gulik (tijmen@vangulik.org)
 * Copyright 2016 Tijmen van Gulik (tijmen@vangulik.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Concept 2 ergometer Performance Monitor api for Cordova
 *
 * This will will work with the PM5
 *
 * Created by tijmen on 01-06-15.
 * License:
 *
 * Copyright 2016 Tijmen van Gulik (tijmen@vangulik.org)
 * Copyright 2016 Tijmen van Gulik (tijmen@vangulik.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function (ergometer) {
    var MonitorConnectionState;
    (function (MonitorConnectionState) {
        MonitorConnectionState[MonitorConnectionState["inactive"] = 0] = "inactive";
        MonitorConnectionState[MonitorConnectionState["deviceReady"] = 1] = "deviceReady";
        MonitorConnectionState[MonitorConnectionState["scanning"] = 2] = "scanning";
        MonitorConnectionState[MonitorConnectionState["connecting"] = 3] = "connecting";
        MonitorConnectionState[MonitorConnectionState["connected"] = 4] = "connected";
        MonitorConnectionState[MonitorConnectionState["servicesFound"] = 5] = "servicesFound";
        MonitorConnectionState[MonitorConnectionState["readyForCommunication"] = 6] = "readyForCommunication";
    })(MonitorConnectionState = ergometer.MonitorConnectionState || (ergometer.MonitorConnectionState = {}));
    var LogLevel;
    (function (LogLevel) {
        LogLevel[LogLevel["error"] = 0] = "error";
        LogLevel[LogLevel["info"] = 1] = "info";
        LogLevel[LogLevel["debug"] = 2] = "debug";
        LogLevel[LogLevel["trace"] = 3] = "trace";
    })(LogLevel = ergometer.LogLevel || (ergometer.LogLevel = {}));
    /**
     *
     * Usage:
     *
     * Create this class to acess the performance data
     *   var performanceMonitor= new ergometer.PerformanceMonitor();
     *
     * after this connect to the events to get data
     *   performanceMonitor.rowingGeneralStatusEvent.sub(this,this.onRowingGeneralStatus);
     * On some android phones you can connect to a limited number of events. Use the multiplex property to overcome
     * this problem. When the multi plex mode is switched on the data send to the device can be a a bit different, see
     * the documentation in the properties You must set the multi plex property before connecting
     *   performanceMonitor.multiplex=true;
     *
     * to start the connection first start scanning for a device,
     * you should call when the cordova deviceready event is called (or later)
     *   performanceMonitor.startScan((device : ergometer.DeviceInfo) : boolean => {
     *      //return true when you want to connect to the device
     *       return device.name=='My device name';
     *   });
     *  to connect at at a later time
     *    performanceMonitor.connectToDevice('my device name');
     *  the devices which where found during the scan are collected in
     *    performanceMonitor.devices
     *  when you connect to a device the scan is stopped, when you want to stop the scan earlier you need to call
     *    performanceMonitor.stopScan
     *
     */
    var PerformanceMonitor = /** @class */ (function () {
        /**
         * To work with this class you will need to create it.
         */
        function PerformanceMonitor() {
            this._connectionState = MonitorConnectionState.inactive;
            //events
            this._logEvent = new ergometer.pubSub.Event();
            this._connectionStateChangedEvent = new ergometer.pubSub.Event();
            this._devices = [];
            this._multiplex = false;
            this._multiplexSubscribeCount = 0;
            this._sampleRate = 1 /* rate500ms */;
            this._autoReConnect = true;
            this._logLevel = LogLevel.error;
            this._csafeBuffer = null;
            this._waitResponseCommands = [];
            this._generalStatusEventAttachedByPowerCurve = false;
            this._recording = false;
            this.initialize();
        }
        Object.defineProperty(PerformanceMonitor.prototype, "recordingDriver", {
            get: function () {
                if (!this._recordingDriver) {
                    this._recordingDriver = new ergometer.ble.RecordingDriver(this, this._driver);
                }
                return this._recordingDriver;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "recording", {
            get: function () {
                return this._recording;
            },
            set: function (value) {
                this._recording = value;
                if (value)
                    this.recordingDriver.startRecording();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "replayDriver", {
            get: function () {
                if (!this._replayDriver)
                    this._replayDriver = new ergometer.ble.ReplayDriver(this, this._driver);
                return this._replayDriver;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "replaying", {
            get: function () {
                return this.replayDriver.playing;
            },
            set: function (value) {
                this.replayDriver.playing = value;
            },
            enumerable: true,
            configurable: true
        });
        PerformanceMonitor.prototype.replay = function (events) {
            this.replayDriver.replay(events);
        };
        Object.defineProperty(PerformanceMonitor.prototype, "recordingEvents", {
            get: function () {
                return this.recordingDriver.events;
            },
            set: function (value) {
                this.recordingDriver.events = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "driver", {
            get: function () {
                if (this.recording) {
                    return this.recordingDriver;
                }
                else if (this.replaying)
                    return this.replayDriver;
                else
                    return this._driver;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "logLevel", {
            /**
             * By default it the logEvent will return errors if you want more debug change the log level
             * @returns {LogLevel}
             */
            get: function () {
                return this._logLevel;
            },
            /**
             * By default it the logEvent will return errors if you want more debug change the log level
             * @param value
             */
            set: function (value) {
                this._logLevel = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "autoReConnect", {
            /**
             * when the connection is lost re-connect
             * @returns {boolean}
             */
            get: function () {
                return this._autoReConnect;
            },
            /**
             *
             * when the connection is lost re-connect
             * @param value
             */
            set: function (value) {
                this._autoReConnect = value;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "multiplex", {
            /**
             * On some android phones you can connect to a limited number of events. Use the multiplex property to overcome
             * this problem. When the multi plex mode is switched on the data send to the device can be a a bit different, see
             * the documentation in the properties You must set the multi plex property before connecting
             *
             * @returns {boolean}
             */
            get: function () {
                return this._multiplex;
            },
            /**
             * On some android phones you can connect to a limited number of events. Use the multiplex property to overcome
             * this problem. When the multi plex mode is switched on the data send to the device can be a a bit different, see
             * the documentation in the properties You must set the multi plex property before connecting
             * @param value
             */
            set: function (value) {
                if (value != this._multiplex) {
                    if (this.connectionState >= MonitorConnectionState.servicesFound)
                        throw "property multiplex can not be changed after the connection is made.";
                    this._multiplex = value;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "devices", {
            /**
             * an array of of performance monitor devices which where found during the scan.
             * the array is sorted by connection quality (best on top)
             *
             * @returns {DeviceInfo[]}
             */
            get: function () {
                return this._devices;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "rowingGeneralStatus", {
            /**
             * The values of the last rowingGeneralStatus event
             *
             * @returns {RowingGeneralStatus}
             */
            get: function () {
                return this._rowingGeneralStatus;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "rowingAdditionalStatus1", {
            /**
             * The values of the last rowingAdditionalStatus1 event
             * @returns {RowingAdditionalStatus1}
             */
            get: function () {
                return this._rowingAdditionalStatus1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "rowingAdditionalStatus2", {
            /**
             * The values of the last RowingAdditionalStatus2 event
             * @returns {RowingAdditionalStatus2}
             */
            get: function () {
                return this._rowingAdditionalStatus2;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "rowingStrokeData", {
            /**
             *  The values of the last rowingStrokeData event
             * @returns {RowingStrokeData}
             */
            get: function () {
                return this._rowingStrokeData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "rowingAdditionalStrokeData", {
            /**
             * The values of the last rowingAdditionalStrokeData event
             * @returns {RowingAdditionalStrokeData}
             */
            get: function () {
                return this._rowingAdditionalStrokeData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "rowingSplitIntervalData", {
            /**
             * The values of the last rowingSplitIntervalData event
             * @returns {RowingSplitIntervalData}
             */
            get: function () {
                return this._rowingSplitIntervalData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "rowingAdditionalSplitIntervalData", {
            /**
             * The values of the last rowingAdditionalSplitIntervalData event
             * @returns {RowingAdditionalSplitIntervalData}
             */
            get: function () {
                return this._rowingAdditionalSplitIntervalData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "workoutSummaryData", {
            /**
             * The values of the last workoutSummaryData event
             * @returns {WorkoutSummaryData}
             */
            get: function () {
                return this._workoutSummaryData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "additionalWorkoutSummaryData", {
            /**
             * The values of the last additionalWorkoutSummaryData event
             * @returns {AdditionalWorkoutSummaryData}
             */
            get: function () {
                return this._additionalWorkoutSummaryData;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "additionalWorkoutSummaryData2", {
            /**
             * The values of the last AdditionalWorkoutSummaryData2 event
             * @returns {AdditionalWorkoutSummaryData2}
             */
            get: function () {
                return this._additionalWorkoutSummaryData2;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "heartRateBeltInformation", {
            /**
             * The values of the last heartRateBeltInformation event
             * @returns {HeartRateBeltInformation}
             */
            get: function () {
                return this._heartRateBeltInformation;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "rowingGeneralStatusEvent", {
            /**
             * read rowingGeneralStatus data
             * connect to the using .sub(this,myFunction)
             * @returns {pubSub.Event<RowingGeneralStatusEvent>}
             */
            get: function () {
                return this._rowingGeneralStatusEvent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "rowingAdditionalStatus1Event", {
            /**
             * read rowingGeneralStatus1 data
             * connect to the using .sub(this,myFunction)
             * @returns {pubSub.Event<RowingAdditionalStatus1Event>}
             */
            get: function () {
                return this._rowingAdditionalStatus1Event;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "rowingAdditionalStatus2Event", {
            /**
             * read rowingAdditionalStatus2 data
             * connect to the using .sub(this,myFunction)
             * @returns {pubSub.Event<RowingAdditionalStatus2Event>}
             */
            get: function () {
                return this._rowingAdditionalStatus2Event;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "rowingStrokeDataEvent", {
            /**
             * read rowingStrokeData data
             * connect to the using .sub(this,myFunction)
             * @returns {pubSub.Event<RowingStrokeDataEvent>}
             */
            get: function () {
                return this._rowingStrokeDataEvent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "rowingAdditionalStrokeDataEvent", {
            /**
             * read rowingAdditionalStrokeData data
             * connect to the using .sub(this,myFunction)
             * @returns {pubSub.Event<RowingAdditionalStrokeDataEvent>}
             */
            get: function () {
                return this._rowingAdditionalStrokeDataEvent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "rowingSplitIntervalDataEvent", {
            /**
             * read rowingSplitIntervalDat data
             * connect to the using .sub(this,myFunction)
             * @returns {pubSub.Event<RowingSplitIntervalDataEvent>}
             */
            get: function () {
                return this._rowingSplitIntervalDataEvent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "rowingAdditionalSplitIntervalDataEvent", {
            /**
             * read rowingAdditionalSplitIntervalData data
             * connect to the using .sub(this,myFunction)
             * @returns {pubSub.Event<RowingAdditionalSplitIntervalDataEvent>}
             */
            get: function () {
                return this._rowingAdditionalSplitIntervalDataEvent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "workoutSummaryDataEvent", {
            /**
             * read workoutSummaryData data
             * connect to the using .sub(this,myFunction)
             * @returns {pubSub.Event<WorkoutSummaryDataEvent>}
             */
            get: function () {
                return this._workoutSummaryDataEvent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "additionalWorkoutSummaryDataEvent", {
            /**
             * read additionalWorkoutSummaryData data
             * connect to the using .sub(this,myFunction)
             * @returns {pubSub.Event<AdditionalWorkoutSummaryDataEvent>}
             */
            get: function () {
                return this._additionalWorkoutSummaryDataEvent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "additionalWorkoutSummaryData2Event", {
            /**
             * read additionalWorkoutSummaryData2 data
             * connect to the using .sub(this,myFunction)
             * @returns {pubSub.Event<AdditionalWorkoutSummaryData2Event>}
             */
            get: function () {
                return this._additionalWorkoutSummaryData2Event;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "heartRateBeltInformationEvent", {
            /**
             * read heartRateBeltInformation data
             * connect to the using .sub(this,myFunction)
             * @returns {pubSub.Event<HeartRateBeltInformationEvent>}
             */
            get: function () {
                return this._heartRateBeltInformationEvent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "powerCurveEvent", {
            get: function () {
                return this._powerCurveEvent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "connectionStateChangedEvent", {
            /**
             * event which is called when the connection state is changed. For example this way you
             * can check if the device is disconnected.
             * connect to the using .sub(this,myFunction)
             * @returns {pubSub.Event<ConnectionStateChangedEvent>}
             */
            get: function () {
                return this._connectionStateChangedEvent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "logEvent", {
            /**
             * returns error and other log information. Some errors can only be received using the logEvent
             * @returns {pubSub.Event<LogEvent>}
             */
            get: function () {
                return this._logEvent;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "powerCurve", {
            get: function () {
                return this._powerCurve;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "deviceInfo", {
            /**
             * Get device information of the connected device.
             * @returns {DeviceInfo}
             */
            get: function () {
                return this._deviceInfo;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PerformanceMonitor.prototype, "sampleRate", {
            /**
             * read the performance montitor sample rate. By default this is 500 ms
             * @returns {number}
             */
            get: function () {
                return this._sampleRate;
            },
            /**
             * Change the performance monitor sample rate.
             * @param value
             */
            set: function (value) {
                var _this = this;
                if (value != this._sampleRate) {
                    var dataView = new DataView(new ArrayBuffer(1));
                    dataView.setUint8(0, value);
                    this.driver.writeCharacteristic(ergometer.ble.PMROWING_SERVICE, ergometer.ble.ROWING_STATUS_SAMPLE_RATE_CHARACTERISIC, dataView)
                        .then(function () {
                            _this._sampleRate = value;
                        }, this.getErrorHandlerFunc("Can not set sample rate"));
                }
            },
            enumerable: true,
            configurable: true
        });
        /**
         * disconnect the current connected device
         */
        PerformanceMonitor.prototype.disconnect = function () {
            if (this.connectionState >= MonitorConnectionState.deviceReady) {
                this.driver.disconnect();
                this._connectionState = MonitorConnectionState.deviceReady;
            }
        };
        Object.defineProperty(PerformanceMonitor.prototype, "connectionState", {
            /**
             * read the current connection state
             * @returns {MonitorConnectionState}
             */
            get: function () {
                return this._connectionState;
            },
            enumerable: true,
            configurable: true
        });
        /**
         *
         * @param value
         */
        PerformanceMonitor.prototype.changeConnectionState = function (value) {
            if (this._connectionState != value) {
                var oldValue = this._connectionState;
                this._connectionState = value;
                this.connectionStateChangedEvent.pub(oldValue, value);
            }
        };
        /**
         *
         */
        PerformanceMonitor.prototype.enableMultiplexNotification = function () {
            var _this = this;
            if (this._multiplexSubscribeCount == 0)
                this.driver.enableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.MULTIPLEXED_INFO_CHARACTERISIC, function (data) { _this.handleDataCallbackMulti(data); })
                    .catch(this.getErrorHandlerFunc("Can not enable multiplex"));
            this._multiplexSubscribeCount++;
        };
        /**
         *
         */
        PerformanceMonitor.prototype.disableMultiPlexNotification = function () {
            this._multiplexSubscribeCount--;
            if (this._multiplexSubscribeCount == 0)
                this.driver.disableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.MULTIPLEXED_INFO_CHARACTERISIC)
                    .catch(this.getErrorHandlerFunc("can not disable multiplex"));
        };
        /**
         *
         */
        PerformanceMonitor.prototype.enableDisableNotification = function () {
            var _this = this;
            if (this.connectionState >= MonitorConnectionState.servicesFound) {
                if (this.rowingGeneralStatusEvent.count > 0) {
                    if (this.multiplex) {
                        this.enableMultiplexNotification();
                    }
                    else {
                        this.driver.enableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.ROWING_STATUS_CHARACTERISIC, function (data) {
                            _this.handleDataCallback(data, _this.handleRowingGeneralStatus);
                        }).catch(this.getErrorHandlerFunc(""));
                    }
                }
                else {
                    if (this.multiplex)
                        this.disableMultiPlexNotification();
                    else
                        this.driver.disableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.ROWING_STATUS_CHARACTERISIC)
                            .catch(this.getErrorHandlerFunc(""));
                }
                if (this.rowingAdditionalStatus1Event.count > 0) {
                    if (this.multiplex) {
                        this.enableMultiplexNotification();
                    }
                    else {
                        this.driver.enableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.EXTRA_STATUS1_CHARACTERISIC, function (data) {
                            _this.handleDataCallback(data, _this.handleRowingAdditionalStatus1);
                        }).catch(this.getErrorHandlerFunc(""));
                    }
                }
                else {
                    if (this.multiplex)
                        this.disableMultiPlexNotification();
                    else
                        this.driver.disableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.EXTRA_STATUS1_CHARACTERISIC)
                            .catch(this.getErrorHandlerFunc(""));
                }
                if (this.rowingAdditionalStatus2Event.count > 0) {
                    if (this.multiplex) {
                        this.enableMultiplexNotification();
                    }
                    else {
                        this.driver.enableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.EXTRA_STATUS2_CHARACTERISIC, function (data) {
                            _this.handleDataCallback(data, _this.handleRowingAdditionalStatus2);
                        }).catch(this.getErrorHandlerFunc(""));
                    }
                }
                else {
                    if (this.multiplex)
                        this.disableMultiPlexNotification();
                    else
                        this.driver.disableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.EXTRA_STATUS2_CHARACTERISIC)
                            .catch(this.getErrorHandlerFunc(""));
                }
                if (this.rowingStrokeDataEvent.count > 0) {
                    if (this.multiplex) {
                        this.enableMultiplexNotification();
                    }
                    else {
                        this.driver.enableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.STROKE_DATA_CHARACTERISIC, function (data) {
                            _this.handleDataCallback(data, _this.handleRowingStrokeData);
                        }).catch(this.getErrorHandlerFunc(""));
                    }
                }
                else {
                    if (this.multiplex)
                        this.disableMultiPlexNotification();
                    else
                        this.driver.disableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.STROKE_DATA_CHARACTERISIC)
                            .catch(this.getErrorHandlerFunc(""));
                }
                if (this.rowingAdditionalStrokeDataEvent.count > 0) {
                    if (this.multiplex) {
                        this.enableMultiplexNotification();
                    }
                    else {
                        this.driver.enableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.EXTRA_STROKE_DATA_CHARACTERISIC, function (data) {
                            _this.handleDataCallback(data, _this.handleRowingAdditionalStrokeData);
                        }).catch(this.getErrorHandlerFunc(""));
                    }
                }
                else {
                    if (this.multiplex)
                        this.disableMultiPlexNotification();
                    else
                        this.driver.disableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.EXTRA_STROKE_DATA_CHARACTERISIC)
                            .catch(this.getErrorHandlerFunc(""));
                }
                if (this.rowingSplitIntervalDataEvent.count > 0) {
                    if (this.multiplex) {
                        this.enableMultiplexNotification();
                    }
                    else {
                        this.driver.enableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.SPLIT_INTERVAL_DATA_CHARACTERISIC, function (data) {
                            _this.handleDataCallback(data, _this.handleRowingSplitIntervalData);
                        }).catch(this.getErrorHandlerFunc(""));
                    }
                }
                else {
                    if (this.multiplex)
                        this.disableMultiPlexNotification();
                    else
                        this.driver.disableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.SPLIT_INTERVAL_DATA_CHARACTERISIC)
                            .catch(this.getErrorHandlerFunc(""));
                }
                if (this.rowingAdditionalSplitIntervalDataEvent.count > 0) {
                    if (this.multiplex) {
                        this.enableMultiplexNotification();
                    }
                    else {
                        this.driver.enableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.EXTRA_SPLIT_INTERVAL_DATA_CHARACTERISIC, function (data) {
                            _this.handleDataCallback(data, _this.handleRowingAdditionalSplitIntervalData);
                        }).catch(this.getErrorHandlerFunc(""));
                    }
                }
                else {
                    if (this.multiplex)
                        this.disableMultiPlexNotification();
                    else
                        this.driver.disableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.EXTRA_SPLIT_INTERVAL_DATA_CHARACTERISIC)
                            .catch(this.getErrorHandlerFunc(""));
                }
                if (this.workoutSummaryDataEvent.count > 0) {
                    if (this.multiplex) {
                        this.enableMultiplexNotification();
                    }
                    else {
                        this.driver.enableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.ROWING_SUMMARY_CHARACTERISIC, function (data) {
                            _this.handleDataCallback(data, _this.handleWorkoutSummaryData);
                        }).catch(this.getErrorHandlerFunc(""));
                    }
                }
                else {
                    if (this.multiplex)
                        this.disableMultiPlexNotification();
                    else
                        this.driver.disableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.ROWING_SUMMARY_CHARACTERISIC)
                            .catch(this.getErrorHandlerFunc(""));
                }
                if (this.additionalWorkoutSummaryDataEvent.count > 0) {
                    if (this.multiplex) {
                        this.enableMultiplexNotification();
                    }
                    else {
                        this.driver.enableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.EXTRA_ROWING_SUMMARY_CHARACTERISIC, function (data) {
                            _this.handleDataCallback(data, _this.handleAdditionalWorkoutSummaryData);
                        }).catch(this.getErrorHandlerFunc(""));
                    }
                }
                else {
                    if (this.multiplex)
                        this.disableMultiPlexNotification();
                    else
                        this.driver.disableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.EXTRA_ROWING_SUMMARY_CHARACTERISIC)
                            .catch(this.getErrorHandlerFunc(""));
                }
                if (this.additionalWorkoutSummaryData2Event.count > 0) {
                    if (this.multiplex) {
                        this.enableMultiplexNotification();
                    }
                    //this data is only available for multi ples
                }
                else {
                    if (this.multiplex)
                        this.disableMultiPlexNotification();
                }
                if (this.heartRateBeltInformationEvent.count > 0) {
                    if (this.multiplex) {
                        this.enableMultiplexNotification();
                    }
                    else {
                        this.driver.enableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.HEART_RATE_BELT_INFO_CHARACTERISIC, function (data) {
                            _this.handleDataCallback(data, _this.handleHeartRateBeltInformation);
                        }).catch(this.getErrorHandlerFunc(""));
                    }
                }
                else {
                    if (this.multiplex)
                        this.disableMultiPlexNotification();
                    else
                        this.driver.disableNotification(ergometer.ble.PMROWING_SERVICE, ergometer.ble.HEART_RATE_BELT_INFO_CHARACTERISIC)
                            .catch(this.getErrorHandlerFunc(""));
                }
                if (this.powerCurveEvent.count > 0) {
                    //when the status changes collect the power info
                    if (!this._generalStatusEventAttachedByPowerCurve) {
                        this._generalStatusEventAttachedByPowerCurve = true;
                        this.rowingGeneralStatusEvent.sub(this, this.onPowerCurveRowingGeneralStatus);
                    }
                }
                else {
                    if (this._generalStatusEventAttachedByPowerCurve) {
                        this._generalStatusEventAttachedByPowerCurve = false;
                        this.rowingGeneralStatusEvent.unsub(this.onPowerCurveRowingGeneralStatus);
                    }
                }
            }
        };
        PerformanceMonitor.prototype.onPowerCurveRowingGeneralStatus = function (data) {
            var _this = this;
            this.traceInfo('RowingGeneralStatus:' + JSON.stringify(data));
            //test to receive the power curve
            if (this.rowingGeneralStatus && this.rowingGeneralStatus.strokeState != data.strokeState) {
                if (data.strokeState == 4 /* recoveryState */) {
                    //send a power curve request
                    this.csafeBuffer
                        .clear()
                        .getPowerCurve({
                            onDataReceived: function (curve) {
                                _this.powerCurveEvent.pub(curve);
                                _this._powerCurve = curve;
                            }
                        })
                        .send();
                }
            }
        };
        /**
         *
         */
        PerformanceMonitor.prototype.initialize = function () {
            var _this = this;
            /*document.addEventListener(
                'deviceready',
                 ()=> {
                     evothings.scriptsLoaded(()=>{
                         this.onDeviceReady();})},
                false);   */
            if ((typeof bleat !== 'undefined') && bleat)
                this._driver = new ergometer.ble.DriverBleat();
            else if ((typeof simpleBLE !== 'undefined') && simpleBLE)
                this._driver = new ergometer.ble.DriverSimpleBLE();
            else if (ergometer.ble.hasWebBlueTooth())
                this._driver = new ergometer.ble.DriverWebBlueTooth(this);
            else
                this.handleError("No suitable blue tooth driver found to connect to the ergometer. You need to load bleat on native platforms and a browser with web blue tooth capability.");
            var enableDisableFunc = function () { _this.enableDisableNotification(); };
            this._rowingGeneralStatusEvent = new ergometer.pubSub.Event();
            this.rowingGeneralStatusEvent.registerChangedEvent(enableDisableFunc);
            this._rowingAdditionalStatus1Event = new ergometer.pubSub.Event();
            this.rowingAdditionalStatus1Event.registerChangedEvent(enableDisableFunc);
            this._rowingAdditionalStatus2Event = new ergometer.pubSub.Event();
            this.rowingAdditionalStatus2Event.registerChangedEvent(enableDisableFunc);
            this._rowingStrokeDataEvent = new ergometer.pubSub.Event();
            this.rowingStrokeDataEvent.registerChangedEvent(enableDisableFunc);
            this._rowingAdditionalStrokeDataEvent = new ergometer.pubSub.Event();
            this.rowingAdditionalStrokeDataEvent.registerChangedEvent(enableDisableFunc);
            this._rowingSplitIntervalDataEvent = new ergometer.pubSub.Event();
            this.rowingSplitIntervalDataEvent.registerChangedEvent(enableDisableFunc);
            this._rowingAdditionalSplitIntervalDataEvent = new ergometer.pubSub.Event();
            this.rowingAdditionalSplitIntervalDataEvent.registerChangedEvent(enableDisableFunc);
            this._workoutSummaryDataEvent = new ergometer.pubSub.Event();
            this.workoutSummaryDataEvent.registerChangedEvent(enableDisableFunc);
            this._additionalWorkoutSummaryDataEvent = new ergometer.pubSub.Event();
            this.additionalWorkoutSummaryDataEvent.registerChangedEvent(enableDisableFunc);
            this._additionalWorkoutSummaryData2Event = new ergometer.pubSub.Event();
            this.additionalWorkoutSummaryData2Event.registerChangedEvent(enableDisableFunc);
            this._heartRateBeltInformationEvent = new ergometer.pubSub.Event();
            this.heartRateBeltInformationEvent.registerChangedEvent(enableDisableFunc);
            this._powerCurveEvent = new ergometer.pubSub.Event();
            this._powerCurveEvent.registerChangedEvent(enableDisableFunc);
        };
        /**
         * When low level initialization complete, this function is called.
         */
        /*
        protected onDeviceReady() {
            // Report status.
           this.changeConnectionState( MonitorConnectionState.deviceReady);
            if (this._active)
              this.startConnection();

        }
        */
        /**
         * Print debug info to console and application UI.
         * @param info
         */
        PerformanceMonitor.prototype.traceInfo = function (info) {
            if (this.logLevel >= LogLevel.trace)
                this.logEvent.pub(info, LogLevel.trace);
        };
        /**
         *
         * @param info
         */
        PerformanceMonitor.prototype.debugInfo = function (info) {
            if (this.logLevel >= LogLevel.debug)
                this.logEvent.pub(info, LogLevel.debug);
        };
        /**
         *
         * @param info
         */
        PerformanceMonitor.prototype.showInfo = function (info) {
            if (this.logLevel >= LogLevel.info)
                this.logEvent.pub(info, LogLevel.info);
        };
        /**
         * call the global error hander and call the optional error handler if given
         * @param error
         */
        PerformanceMonitor.prototype.handleError = function (error, errorFn) {
            if (this.logLevel >= LogLevel.error)
                this.logEvent.pub(error, LogLevel.error);
            if (errorFn)
                errorFn(error);
        };
        /**
         * Get an error function which adds the errorDescription to the error ,cals the global and an optional local funcion
         * @param errorDescription
         * @param errorFn
         */
        PerformanceMonitor.prototype.getErrorHandlerFunc = function (errorDescription, errorFn) {
            var _this = this;
            return function (e) {
                _this.handleError(errorDescription + ':' + e.toString(), errorFn);
            };
        };
        /**
         *
         * @param device
         */
        PerformanceMonitor.prototype.removeDevice = function (device) {
            this._devices = this._devices.splice(this._devices.indexOf(device), 1);
        };
        /**
         *
         * @param device
         */
        PerformanceMonitor.prototype.addDevice = function (device) {
            var existing = this.findDevice(device.name);
            if (existing)
                this.removeDevice(existing);
            this._devices.push(device);
            //sort on hightest quality above
            this._devices.sort(function (device1, device2) { return device2.quality - device1.quality; });
        };
        /**
         *
         * @param name
         * @returns {DeviceInfo}
         */
        PerformanceMonitor.prototype.findDevice = function (name) {
            var result = null;
            this._devices.forEach(function (device) {
                if (device.name == name)
                    result = device;
            });
            return result;
        };
        /**
         *
         */
        PerformanceMonitor.prototype.stopScan = function () {
            if (this.connectionState == MonitorConnectionState.scanning) {
                this.driver.stopScan();
            }
        };
        /**
         * Scan for device use the deviceFound to connect .
         * @param deviceFound
         */
        PerformanceMonitor.prototype.startScan = function (deviceFound, errorFn) {
            var _this = this;
            this._devices = [];
            // Save it for next time we use the this.
            //localStorage.setItem('deviceName', this._deviceName);
            // Call stop before you start, just in case something else is running.
            this.stopScan();
            this.changeConnectionState(MonitorConnectionState.scanning);
            // Only report s once.
            //evothings.easyble.reportDeviceOnce(true);
            return this.driver.startScan(function (device) {
                // Do not show un-named devices.
                /*var deviceName = device.advertisementData ?
                 device.advertisementData.kCBAdvDataLocalName : null;
                 */
                if (!device.name) {
                    return;
                }
                // Print "name : mac address" for every device found.
                _this.debugInfo(device.name + ' : ' + device.address.toString().split(':').join(''));
                // If my device is found connect to it.
                //find any thing starting with PM and then a number a space and a serial number
                if (device.name.match(/PM\d \d*/g)) {
                    _this.showInfo('Status: DeviceInfo found: ' + device.name);
                    var deviceInfo = {
                        connected: false,
                        _internalDevice: device,
                        name: device.name,
                        address: device.address,
                        quality: 2 * (device.rssi + 100)
                    };
                    _this.addDevice(deviceInfo);
                    if (deviceFound(deviceInfo)) {
                        _this.connectToDevice(deviceInfo.name);
                    }
                }
            }).then(function () {
                _this.showInfo('Status: Scanning...');
            }).catch(this.getErrorHandlerFunc("Scan error", errorFn));
        };
        /**
         * connect to a specific device. This should be a PM5 device which is found by the startScan. You can
         * only call this function after startScan is called. Connection to a device will stop the scan.
         * @param deviceName
         */
        PerformanceMonitor.prototype.connectToDevice = function (deviceName) {
            var _this = this;
            this.showInfo('Status: Connecting...');
            this.stopScan();
            this.changeConnectionState(MonitorConnectionState.connecting);
            var deviceInfo = this.findDevice(deviceName);
            if (!deviceInfo)
                throw "Device " + deviceName + " not found";
            this._deviceInfo = deviceInfo;
            return this.driver.connect(deviceInfo._internalDevice, function () {
                _this.changeConnectionState(MonitorConnectionState.deviceReady);
                _this.showInfo('Disconnected');
                if (_this.autoReConnect) {
                    _this.startScan(function (device) {
                        return device.name == deviceName;
                    });
                }
            }).then(function () {
                _this.changeConnectionState(MonitorConnectionState.connected);
                _this.showInfo('Status: Connected');
                return _this.readPheripheralInfo();
            }).then(function () {
                // Debug logging of all services, characteristics and descriptors
                // reported by the BLE board.
                _this.deviceConnected();
            }).catch(function (errorCode) {
                _this.changeConnectionState(MonitorConnectionState.deviceReady);
                _this.handleError(errorCode);
            });
        };
        /**
         * the promise is never fail
         * @param serviceUUID
         * @param UUID
         * @param readValue
         */
        PerformanceMonitor.prototype.readStringCharacteristic = function (serviceUUID, UUID) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                _this.driver.readCharacteristic(serviceUUID, UUID).then(function (data) {
                    resolve(ergometer.utils.bufferToString(data));
                }, reject);
            });
        };
        /**
         * the promise will never fail
         * @param done
         */
        PerformanceMonitor.prototype.readSampleRate = function () {
            var _this = this;
            return this.driver.readCharacteristic(ergometer.ble.PMROWING_SERVICE, ergometer.ble.ROWING_STATUS_SAMPLE_RATE_CHARACTERISIC)
                .then(function (data) {
                    var view = new DataView(data);
                    _this._sampleRate = view.getUint8(0);
                });
        };
        /**
         *
         * @param done
         */
        PerformanceMonitor.prototype.readPheripheralInfo = function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                Promise.all([
                    _this.readStringCharacteristic(ergometer.ble.PMDEVICE_INFO_SERVICE, ergometer.ble.SERIALNUMBER_CHARACTERISTIC)
                        .then(function (value) {
                            _this._deviceInfo.serial = value;
                        }),
                    _this.readStringCharacteristic(ergometer.ble.PMDEVICE_INFO_SERVICE, ergometer.ble.HWREVISION_CHARACTERISIC)
                        .then(function (value) {
                            _this._deviceInfo.hardwareRevision = value;
                        }),
                    _this.readStringCharacteristic(ergometer.ble.PMDEVICE_INFO_SERVICE, ergometer.ble.FWREVISION_CHARACTERISIC)
                        .then(function (value) {
                            _this._deviceInfo.firmwareRevision = value;
                        }),
                    _this.readStringCharacteristic(ergometer.ble.PMDEVICE_INFO_SERVICE, ergometer.ble.MANUFNAME_CHARACTERISIC)
                        .then(function (value) {
                            _this._deviceInfo.manufacturer = value;
                            _this._deviceInfo.connected = true;
                        }),
                    _this.readSampleRate()
                ]).then(function () { resolve(); }, function (e) { _this.handleError(e); resolve(e); }); //log erro let not get this into the way of connecting
            });
        };
        /**
         *
         * @param data
         */
        PerformanceMonitor.prototype.handleRowingGeneralStatus = function (data) {
            var parsed = {
                elapsedTime: ergometer.utils.getUint24(data, 0 /* ELAPSED_TIME_LO */) * 10,
                distance: ergometer.utils.getUint24(data, 3 /* DISTANCE_LO */) / 10,
                workoutType: data.getUint8(6 /* WORKOUT_TYPE */),
                intervalType: data.getUint8(7 /* INTERVAL_TYPE */),
                workoutState: data.getUint8(8 /* WORKOUT_STATE */),
                rowingState: data.getUint8(9 /* ROWING_STATE */),
                strokeState: data.getUint8(10 /* STROKE_STATE */),
                totalWorkDistance: ergometer.utils.getUint24(data, 11 /* TOTAL_WORK_DISTANCE_LO */),
                workoutDuration: ergometer.utils.getUint24(data, 14 /* WORKOUT_DURATION_LO */),
                workoutDurationType: data.getUint8(17 /* WORKOUT_DURATION_TYPE */),
                dragFactor: data.getUint8(18 /* DRAG_FACTOR */),
            };
            if (parsed.workoutDurationType == 0 /* timeDuration */)
                parsed.workoutDuration = parsed.workoutDuration * 10; //in mili seconds
            if (JSON.stringify(this.rowingGeneralStatus) !== JSON.stringify(parsed)) {
                this.rowingGeneralStatusEvent.pub(parsed);
                this._rowingGeneralStatus = parsed;
            }
        };
        PerformanceMonitor.prototype.calcPace = function (lowByte, highByte) {
            return (lowByte + highByte * 256) * 10;
        };
        /**
         *
         * @param data
         */
        PerformanceMonitor.prototype.handleRowingAdditionalStatus1 = function (data) {
            var parsed = {
                elapsedTime: ergometer.utils.getUint24(data, 0 /* ELAPSED_TIME_LO */) * 10,
                speed: data.getUint16(3 /* SPEED_LO */) / 1000,
                strokeRate: data.getUint8(5 /* STROKE_RATE */),
                heartRate: ergometer.utils.valueToNullValue(data.getUint8(6 /* HEARTRATE */), 255),
                currentPace: this.calcPace(data.getUint8(7 /* CURRENT_PACE_LO */), data.getUint8(8 /* CURRENT_PACE_HI */)),
                averagePace: this.calcPace(data.getUint8(9 /* AVG_PACE_LO */), data.getUint8(10 /* AVG_PACE_HI */)),
                restDistance: data.getUint16(11 /* REST_DISTANCE_LO */),
                restTime: ergometer.utils.getUint24(data, 13 /* REST_TIME_LO */) * 10,
                averagePower: null
            };
            if (data.byteLength == 18 /* BLE_PAYLOAD_SIZE */)
                parsed.averagePower = data.getUint16(16 /* AVG_POWER_LO */);
            if (JSON.stringify(this.rowingAdditionalStatus1) !== JSON.stringify(parsed)) {
                this.rowingAdditionalStatus1Event.pub(parsed);
                this._rowingAdditionalStatus1 = parsed;
            }
        };
        /**
         *
         * @param data
         */
        PerformanceMonitor.prototype.handleRowingAdditionalStatus2 = function (data) {
            var parsed;
            if (data.byteLength == 20 /* BLE_PAYLOAD_SIZE */) {
                parsed = {
                    elapsedTime: ergometer.utils.getUint24(data, 0 /* ELAPSED_TIME_LO */) * 10,
                    intervalCount: data.getUint8(3 /* INTERVAL_COUNT */),
                    averagePower: data.getUint16(4 /* AVG_POWER_LO */),
                    totalCalories: data.getUint16(6 /* TOTAL_CALORIES_LO */),
                    splitAveragePace: this.calcPace(data.getUint8(8 /* SPLIT_INTERVAL_AVG_PACE_LO */), data.getUint8(9 /* SPLIT_INTERVAL_AVG_PACE_HI */)),
                    splitAveragePower: data.getUint16(10 /* SPLIT_INTERVAL_AVG_POWER_LO */),
                    splitAverageCalories: data.getUint16(12 /* SPLIT_INTERVAL_AVG_CALORIES_LO */),
                    lastSplitTime: data.getUint16(14 /* LAST_SPLIT_TIME_LO */) * 100,
                    lastSplitDistance: ergometer.utils.getUint24(data, 17 /* LAST_SPLIT_DISTANCE_LO */)
                };
            }
            else {
                parsed = {
                    elapsedTime: ergometer.utils.getUint24(data, 0 /* ELAPSED_TIME_LO */) * 10,
                    intervalCount: data.getUint8(3 /* INTERVAL_COUNT */),
                    averagePower: null,
                    totalCalories: data.getUint16(4 /* TOTAL_CALORIES_LO */),
                    splitAveragePace: this.calcPace(data.getUint8(6 /* SPLIT_INTERVAL_AVG_PACE_LO */), data.getUint8(7 /* SPLIT_INTERVAL_AVG_PACE_HI */)),
                    splitAveragePower: data.getUint16(8 /* SPLIT_INTERVAL_AVG_POWER_LO */),
                    splitAverageCalories: data.getUint16(10 /* SPLIT_INTERVAL_AVG_CALORIES_LO */),
                    lastSplitTime: data.getUint16(12 /* LAST_SPLIT_TIME_LO */) * 100,
                    lastSplitDistance: ergometer.utils.getUint24(data, 15 /* LAST_SPLIT_DISTANCE_LO */)
                };
            }
            if (JSON.stringify(this.rowingAdditionalStatus2) !== JSON.stringify(parsed)) {
                this.rowingAdditionalStatus2Event.pub(parsed);
                this._rowingAdditionalStatus2 = parsed;
            }
        };
        /**
         *
         * @param data
         */
        PerformanceMonitor.prototype.handleRowingStrokeData = function (data) {
            var parsed;
            if (data.byteLength == 20 /* BLE_PAYLOAD_SIZE */) {
                parsed = {
                    elapsedTime: ergometer.utils.getUint24(data, 0 /* ELAPSED_TIME_LO */) * 10,
                    distance: ergometer.utils.getUint24(data, 3 /* DISTANCE_LO */) / 10,
                    driveLength: data.getUint8(6 /* DRIVE_LENGTH */) / 100,
                    driveTime: data.getUint8(7 /* DRIVE_TIME */) * 10,
                    strokeRecoveryTime: data.getUint16(8 /* STROKE_RECOVERY_TIME_LO */) * 10,
                    strokeDistance: data.getUint16(10 /* STROKE_DISTANCE_LO */) / 100,
                    peakDriveForce: data.getUint16(12 /* PEAK_DRIVE_FORCE_LO */) / 10,
                    averageDriveForce: data.getUint16(14 /* AVG_DRIVE_FORCE_LO */) / 10,
                    workPerStroke: data.getUint16(16 /* WORK_PER_STROKE_LO */) / 10,
                    strokeCount: data.getUint16(18 /* STROKE_COUNT_LO */)
                };
            }
            else {
                parsed = {
                    elapsedTime: ergometer.utils.getUint24(data, 0 /* ELAPSED_TIME_LO */) * 10,
                    distance: ergometer.utils.getUint24(data, 3 /* DISTANCE_LO */) / 10,
                    driveLength: data.getUint8(6 /* DRIVE_LENGTH */) / 100,
                    driveTime: data.getUint8(7 /* DRIVE_TIME */) * 10,
                    strokeRecoveryTime: data.getUint16(8 /* STROKE_RECOVERY_TIME_LO */) * 10,
                    strokeDistance: data.getUint16(10 /* STROKE_DISTANCE_LO */) / 100,
                    peakDriveForce: data.getUint16(12 /* PEAK_DRIVE_FORCE_LO */) / 10,
                    averageDriveForce: data.getUint16(14 /* AVG_DRIVE_FORCE_LO */) / 10,
                    workPerStroke: null,
                    strokeCount: data.getUint16(16 /* STROKE_COUNT_LO */)
                };
            }
            if (JSON.stringify(this.rowingStrokeData) !== JSON.stringify(parsed)) {
                this.rowingStrokeDataEvent.pub(parsed);
                this._rowingStrokeData = parsed;
            }
        };
        /**
         *
         * @param data
         */
        PerformanceMonitor.prototype.handleRowingAdditionalStrokeData = function (data) {
            var parsed = {
                elapsedTime: ergometer.utils.getUint24(data, 0 /* ELAPSED_TIME_LO */) * 10,
                strokePower: data.getUint16(3 /* STROKE_POWER_LO */),
                strokeCalories: data.getUint16(5 /* STROKE_CALORIES_LO */),
                strokeCount: data.getUint16(7 /* STROKE_COUNT_LO */),
                projectedWorkTime: ergometer.utils.getUint24(data, 9 /* PROJ_WORK_TIME_LO */) * 1000,
                projectedWorkDistance: ergometer.utils.getUint24(data, 12 /* PROJ_WORK_DIST_LO */),
                workPerStroke: null //filled when multiplexed is true
            };
            if (data.byteLength == 17 /* BLE_PAYLOAD_SIZE */)
                parsed.workPerStroke = data.getUint16(15 /* WORK_PER_STROKE_LO */);
            if (JSON.stringify(this.rowingAdditionalStrokeData) !== JSON.stringify(parsed)) {
                this.rowingAdditionalStrokeDataEvent.pub(parsed);
                this._rowingAdditionalStrokeData = parsed;
            }
        };
        /**
         *
         * @param data
         */
        PerformanceMonitor.prototype.handleRowingSplitIntervalData = function (data) {
            var parsed = {
                elapsedTime: ergometer.utils.getUint24(data, 0 /* ELAPSED_TIME_LO */) * 10,
                distance: ergometer.utils.getUint24(data, 3 /* DISTANCE_LO */) / 10,
                intervalTime: ergometer.utils.getUint24(data, 6 /* SPLIT_TIME_LO */) * 100,
                intervalDistance: ergometer.utils.getUint24(data, 9 /* SPLIT_DISTANCE_LO */),
                intervalRestTime: data.getUint16(12 /* REST_TIME_LO */) * 1000,
                intervalRestDistance: data.getUint16(14 /* REST_DISTANCE_LO */),
                intervalType: data.getUint8(16 /* TYPE */),
                intervalNumber: data.getUint8(17 /* INT_NUMBER */),
            };
            if (JSON.stringify(this.rowingSplitIntervalData) !== JSON.stringify(parsed)) {
                this.rowingSplitIntervalDataEvent.pub(parsed);
                this._rowingSplitIntervalData = parsed;
            }
        };
        /**
         *
         * @param data
         */
        PerformanceMonitor.prototype.handleRowingAdditionalSplitIntervalData = function (data) {
            var parsed = {
                elapsedTime: ergometer.utils.getUint24(data, 0 /* ELAPSED_TIME_LO */) * 10,
                intervalAverageStrokeRate: data.getUint8(3 /* STROKE_RATE */),
                intervalWorkHeartrate: data.getUint8(4 /* WORK_HR */),
                intervalRestHeartrate: data.getUint8(5 /* REST_HR */),
                intervalAveragePace: data.getUint16(6 /* AVG_PACE_LO */) * 10,
                intervalTotalCalories: data.getUint16(8 /* CALORIES_LO */),
                intervalAverageCalories: data.getUint16(10 /* AVG_CALORIES_LO */),
                intervalSpeed: data.getUint16(12 /* SPEED_LO */) / 1000,
                intervalPower: data.getUint16(14 /* POWER_LO */),
                splitAverageDragFactor: data.getUint8(16 /* AVG_DRAG_FACTOR */),
                intervalNumber: data.getUint8(17 /* INT_NUMBER */)
            };
            if (JSON.stringify(this.rowingAdditionalSplitIntervalData) !== JSON.stringify(parsed)) {
                this.rowingAdditionalSplitIntervalDataEvent.pub(parsed);
                this._rowingAdditionalSplitIntervalData = parsed;
            }
        };
        /**
         *
         * @param data
         */
        PerformanceMonitor.prototype.handleWorkoutSummaryData = function (data) {
            var parsed = {
                logEntryDate: data.getUint16(0 /* LOG_DATE_LO */),
                logEntryTime: data.getUint16(2 /* LOG_TIME_LO */),
                elapsedTime: ergometer.utils.getUint24(data, 4 /* ELAPSED_TIME_LO */) * 10,
                distance: ergometer.utils.getUint24(data, 7 /* DISTANCE_LO */) / 10,
                averageStrokeRate: data.getUint8(10 /* AVG_SPM */),
                endingHeartrate: data.getUint8(11 /* END_HR */),
                averageHeartrate: data.getUint8(12 /* AVG_HR */),
                minHeartrate: data.getUint8(13 /* MIN_HR */),
                maxHeartrate: data.getUint8(14 /* MAX_HR */),
                dragFactorAverage: data.getUint8(15 /* AVG_DRAG_FACTOR */),
                recoveryHeartRate: data.getUint8(16 /* RECOVERY_HR */),
                workoutType: data.getUint8(17 /* WORKOUT_TYPE */),
                averagePace: null
            };
            if (data.byteLength == 20 /* BLE_PAYLOAD_SIZE */) {
                parsed.averagePace = data.getUint16(18 /* AVG_PACE_LO */);
            }
            if (JSON.stringify(this.workoutSummaryData) !== JSON.stringify(parsed)) {
                this.workoutSummaryDataEvent.pub(parsed);
                this._workoutSummaryData = parsed;
            }
        };
        /**
         *
         * @param data
         */
        PerformanceMonitor.prototype.handleAdditionalWorkoutSummaryData = function (data) {
            var parsed;
            if (data.byteLength == 19 /* DATA_BLE_PAYLOAD_SIZE */) {
                parsed = {
                    logEntryDate: data.getUint16(0 /* LOG_DATE_LO */),
                    logEntryTime: data.getUint16(1 /* LOG_DATE_HI */),
                    intervalType: data.getUint8(4 /* SPLIT_INT_TYPE */),
                    intervalSize: data.getUint16(5 /* SPLIT_INT_SIZE_LO */),
                    intervalCount: data.getUint8(7 /* SPLIT_INT_COUNT */),
                    totalCalories: data.getUint16(8 /* WORK_CALORIES_LO */),
                    watts: data.getUint16(10 /* WATTS_LO */),
                    totalRestDistance: ergometer.utils.getUint24(data, 12 /* TOTAL_REST_DISTANCE_LO */),
                    intervalRestTime: data.getUint16(15 /* INTERVAL_REST_TIME_LO */),
                    averageCalories: data.getUint16(17 /* AVG_CALORIES_LO */)
                };
            }
            else {
                parsed = {
                    logEntryDate: data.getUint16(0 /* LOG_DATE_LO */),
                    logEntryTime: data.getUint16(2 /* LOG_TIME_LO */),
                    intervalType: null,
                    intervalSize: data.getUint16(4 /* SPLIT_INT_SIZE_LO */),
                    intervalCount: data.getUint8(6 /* SPLIT_INT_COUNT */),
                    totalCalories: data.getUint16(7 /* WORK_CALORIES_LO */),
                    watts: data.getUint16(9 /* WATTS_LO */),
                    totalRestDistance: ergometer.utils.getUint24(data, 11 /* TOTAL_REST_DISTANCE_LO */),
                    intervalRestTime: data.getUint16(14 /* INTERVAL_REST_TIME_LO */),
                    averageCalories: data.getUint16(16 /* AVG_CALORIES_LO */)
                };
            }
            if (JSON.stringify(this.additionalWorkoutSummaryData) !== JSON.stringify(parsed)) {
                this.additionalWorkoutSummaryDataEvent.pub(parsed);
                this._additionalWorkoutSummaryData = parsed;
            }
        };
        /**
         *
         * @param data
         */
        PerformanceMonitor.prototype.handleAdditionalWorkoutSummaryData2 = function (data) {
            var parsed = {
                logEntryDate: data.getUint16(0 /* LOG_DATE_LO */),
                logEntryTime: data.getUint16(1 /* LOG_DATE_HI */),
                averagePace: data.getUint16(4 /* AVG_PACE_LO */),
                gameIdentifier: data.getUint8(6 /* GAME_ID */),
                gameScore: data.getUint16(7 /* GAME_SCORE_LO */),
                ergMachineType: data.getUint8(9 /* MACHINE_TYPE */),
            };
            if (JSON.stringify(this.additionalWorkoutSummaryData2) !== JSON.stringify(parsed)) {
                this.additionalWorkoutSummaryData2Event.pub(parsed);
                this._additionalWorkoutSummaryData2 = parsed;
            }
        };
        /**
         *
         * @param data
         */
        PerformanceMonitor.prototype.handleHeartRateBeltInformation = function (data) {
            var parsed = {
                manufacturerId: data.getUint8(0 /* MANUFACTURER_ID */),
                deviceType: data.getUint8(1 /* DEVICE_TYPE */),
                beltId: data.getUint32(2 /* BELT_ID_LO */),
            };
            if (JSON.stringify(this.heartRateBeltInformation) !== JSON.stringify(parsed)) {
                this.heartRateBeltInformationEvent.pub(parsed);
                this._heartRateBeltInformation = parsed;
            }
        };
        /**
         *
         * @internal
         */
        PerformanceMonitor.prototype.deviceConnected = function () {
            this.debugInfo("readServices success");
            this.debugInfo('Status: notifications are activated');
            //handle to the notification
            this.changeConnectionState(MonitorConnectionState.servicesFound);
            this.enableDisableNotification();
            //allways connect to csafe
            this.handleCSafeNotifications();
            this.changeConnectionState(MonitorConnectionState.readyForCommunication);
        };
        /**
         *
         * @param data
         */
        PerformanceMonitor.prototype.handleDataCallbackMulti = function (data) {
            //this.debugInfo("multi data received: " + evothings.util.typedArrayToHexString(data));
            var ar = new DataView(data);
            var dataType = ar.getUint8(0);
            ar = new DataView(data, 1);
            switch (dataType) {
                case 49 /* ROWING_GENERAL_STATUS */: {
                    if (this.rowingGeneralStatusEvent.count > 0)
                        this.handleRowingGeneralStatus(ar);
                    break;
                }
                case 50 /* ROWING_ADDITIONAL_STATUS1 */: {
                    if (this.rowingAdditionalStatus1Event.count > 0)
                        this.handleRowingAdditionalStatus1(ar);
                    break;
                }
                case 51 /* ROWING_ADDITIONAL_STATUS2 */: {
                    if (this.rowingAdditionalStatus2Event.count > 0)
                        this.handleRowingAdditionalStatus2(ar);
                    break;
                }
                case 53 /* STROKE_DATA_STATUS */: {
                    if (this.rowingStrokeDataEvent.count > 0)
                        this.handleRowingStrokeData(ar);
                    break;
                }
                case 54 /* EXTRA_STROKE_DATA_STATUS */: {
                    if (this.rowingAdditionalStrokeDataEvent.count > 0)
                        this.handleRowingAdditionalStrokeData(ar);
                    break;
                }
                case 55 /* SPLIT_INTERVAL_STATUS */: {
                    if (this.rowingSplitIntervalDataEvent.count > 0)
                        this.handleRowingSplitIntervalData(ar);
                    break;
                }
                case 56 /* EXTRA_SPLIT_INTERVAL_STATUS */: {
                    if (this.rowingAdditionalSplitIntervalDataEvent.count > 0)
                        this.handleRowingAdditionalSplitIntervalData(ar);
                    break;
                }
                case 57 /* WORKOUT_SUMMARY_STATUS */: {
                    if (this.workoutSummaryDataEvent.count > 0)
                        this.handleWorkoutSummaryData(ar);
                    break;
                }
                case 58 /* EXTRA_WORKOUT_SUMMARY_STATUS1 */: {
                    if (this.additionalWorkoutSummaryDataEvent.count > 0)
                        this.handleAdditionalWorkoutSummaryData(ar);
                    break;
                }
                case 59 /* HEART_RATE_BELT_INFO_STATUS */: {
                    if (this.heartRateBeltInformationEvent.count > 0)
                        this.handleHeartRateBeltInformation(ar);
                    break;
                }
                case 60 /* EXTRA_WORKOUT_SUMMARY_STATUS2 */: {
                    if (this.additionalWorkoutSummaryData2Event.count > 0)
                        this.handleAdditionalWorkoutSummaryData2(ar);
                    break;
                }
            }
        };
        ;
        /**
         *
         * @param data
         * @param func
         */
        PerformanceMonitor.prototype.handleDataCallback = function (data, func) {
            //this.debugInfo("data received: " + evothings.util.typedArrayToHexString(data));
            var ar = new DataView(data);
            //call the function within the scope of the object
            func.apply(this, [ar]);
        };
        PerformanceMonitor.prototype.removeOldSendCommands = function () {
            for (var i = this._waitResponseCommands.length - 1; i >= 0; i--) {
                var command = this._waitResponseCommands[i];
                var currentTime = ergometer.utils.getTime();
                //more than 20 seconds in the buffer
                if (currentTime - command._timestamp > 20000) {
                    if (command.onError) {
                        command.onError("Nothing returned in 20 seconds");
                        this.handleError("Nothing returned in 20 seconds from command " + command.command + " " + command.detailCommand);
                    }
                    this._waitResponseCommands.splice(i, 1);
                }
            }
        };
        /* ***************************************************************************************
         *                               csafe
         *****************************************************************************************  */
        /**
         *  send everyt thing which is put into the csave buffer
         *
         * @param success
         * @param error
         * @returns {Promise<void>|Promise} use promis instead of success and error function
         */
        PerformanceMonitor.prototype.sendCSafeBuffer = function () {
            var _this = this;
            this.removeOldSendCommands();
            //prepare the array to be send
            var rawCommandBuffer = this.csafeBuffer.rawCommands;
            var commandArray = [];
            rawCommandBuffer.forEach(function (command) {
                commandArray.push(command.command);
                if (command.command >= ergometer.csafe.defs.CTRL_CMD_SHORT_MIN) {
                    //it is an short command
                    if (command.detailCommand || command.data) {
                        throw "short commands can not contain data or a detail command";
                    }
                }
                else {
                    if (command.detailCommand) {
                        var dataLength = 1;
                        if (command.data && command.data.length > 0)
                            dataLength = dataLength + command.data.length + 1;
                        commandArray.push(dataLength); //length for the short command
                        //the detail command
                        commandArray.push(command.detailCommand);
                    }
                    //the data
                    if (command.data && command.data.length > 0) {
                        commandArray.push(command.data.length);
                        commandArray = commandArray.concat(command.data);
                    }
                }
            });
            this.csafeBuffer.clear();
            //send all the csafe commands in one go
            return this.sendCsafeCommands(commandArray)
                .then(function () {
                    rawCommandBuffer.forEach(function (command) {
                        command._timestamp = new Date().getTime();
                        if (command.waitForResponse)
                            _this._waitResponseCommands.push(command);
                    });
                }, function (e) {
                    rawCommandBuffer.forEach(function (command) {
                        if (command.onError)
                            command.onError(e);
                    });
                });
        };
        PerformanceMonitor.prototype.sendCsafeCommands = function (byteArray) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                //is there anything to send?
                if (byteArray && byteArray.length > 0) {
                    //calc the checksum of the data to be send
                    var checksum = 0;
                    for (var i = 0; i < byteArray.length; i++)
                        checksum = checksum ^ byteArray[i];
                    //prepare all the data to be send in one array
                    //begin with a start byte ad end with a checksum and an end byte
                    var bytesToSend = ([ergometer.csafe.defs.FRAME_START_BYTE].concat(byteArray)).concat([checksum, ergometer.csafe.defs.FRAME_END_BYTE]);
                    //send in packages of max 20 bytes (ble.PACKET_SIZE)
                    var sendBytesIndex = 0;
                    //continue while not all bytes are send
                    while (sendBytesIndex < bytesToSend.length) {
                        //prepare a buffer with the data which can be send in one packet
                        var bufferLength = Math.min(ergometer.ble.PACKET_SIZE, bytesToSend.length - sendBytesIndex);
                        var buffer = new ArrayBuffer(bufferLength); //start and end and
                        var dataView = new DataView(buffer);
                        var bufferIndex = 0;
                        while (bufferIndex < bufferLength) {
                            dataView.setUint8(bufferIndex, bytesToSend[sendBytesIndex]);
                            sendBytesIndex++;
                            bufferIndex++;
                        }
                        _this.traceInfo("send csafe: " + ergometer.utils.typedArrayToHexString(buffer));
                        _this.driver.writeCharacteristic(ergometer.ble.PMCONTROL_SERVICE, ergometer.ble.TRANSMIT_TO_PM_CHARACTERISIC, dataView)
                            .then(function () {
                                _this.traceInfo("csafe command send");
                                if (sendBytesIndex >= bytesToSend.length)
                                    resolve();
                            })
                            .catch(function (e) { reject(e); });
                    }
                }
                else
                    resolve();
            });
        };
        PerformanceMonitor.prototype.receivedCSaveCommand = function (parsed) {
            //check on all the commands which where send and
            for (var i = 0; i < this._waitResponseCommands.length; i++) {
                var command = this._waitResponseCommands[i];
                if (command.command == parsed.command &&
                    (command.detailCommand == parsed.detailCommand ||
                        (!command.detailCommand && !parsed.detailCommand))) {
                    if (command.onDataReceived) {
                        var dataView = new DataView(parsed.data.buffer);
                        command.onDataReceived(dataView);
                    }
                    this._waitResponseCommands.splice(i, 1); //remove the item from the send list
                    break;
                }
            }
        };
        PerformanceMonitor.prototype.handleCSafeNotifications = function () {
            var _this = this;
            var command = 0;
            var commandDataIndex = 0;
            var commandData;
            var frameState = 0 /* initial */;
            var nextDataLength = 0;
            var detailCommand = 0;
            var skippByte = 0;
            var calcCheck = 0;
            this.traceInfo("enable notifications csafe");
            this.driver.enableNotification(ergometer.ble.PMCONTROL_SERVICE, ergometer.ble.RECEIVE_FROM_PM_CHARACTERISIC, function (data) {
                var dataView = new DataView(data);
                //skipp empty 0 ble blocks
                if (dataView.byteLength != 1 || dataView.getUint8(0) != 0) {
                    if (frameState == 0 /* initial */) {
                        commandData = null;
                        commandDataIndex = 0;
                        frameState = 0 /* initial */;
                        nextDataLength = 0;
                        detailCommand = 0;
                        calcCheck = 0;
                    }
                    _this.traceInfo("continious receive csafe: " + ergometer.utils.typedArrayToHexString(data));
                    var i = 0;
                    var stop = false;
                    while (i < dataView.byteLength && !stop) {
                        var currentByte = dataView.getUint8(i);
                        if (frameState != 0 /* initial */) {
                            calcCheck = calcCheck ^ currentByte; //xor for a simple crc check
                        }
                        switch (frameState) {
                            case 0 /* initial */: {
                                //expect a start frame
                                if (currentByte != ergometer.csafe.defs.FRAME_START_BYTE) {
                                    stop = true;
                                    if (_this.logLevel == LogLevel.trace)
                                        _this.traceInfo("stop byte " + ergometer.utils.toHexString(currentByte, 1));
                                }
                                else
                                    frameState = 1 /* skippByte */;
                                calcCheck = 0;
                                break;
                            }
                            case 1 /* skippByte */:
                                {
                                    frameState = 2 /* parseCommand */;
                                    skippByte = currentByte;
                                    break;
                                }
                            case 2 /* parseCommand */: {
                                command = currentByte;
                                frameState = 3 /* parseCommandLength */;
                                break;
                            }
                            case 3 /* parseCommandLength */: {
                                //first work arround strange results where the skipp byte is the same
                                //as the the command and the frame directly ends, What is the meaning of
                                //this? some kind of status??
                                if (skippByte == command && currentByte == ergometer.csafe.defs.FRAME_END_BYTE) {
                                    command = 0; //do not check checksum
                                    frameState = 0 /* initial */; //start again from te beginning
                                }
                                else if (i == dataView.byteLength - 1 && currentByte == ergometer.csafe.defs.FRAME_END_BYTE) {
                                    var checksum = command;
                                    //remove the last 2 bytes from the checksum which was added too much
                                    calcCheck = calcCheck ^ currentByte;
                                    calcCheck = calcCheck ^ command;
                                    //check the calculated with the message checksum
                                    if (checksum != calcCheck)
                                        _this.handleError("Wrong checksum " + ergometer.utils.toHexString(checksum, 1) + " expected " + ergometer.utils.toHexString(calcCheck, 1) + " ");
                                    command = 0; //do not check checksum
                                    frameState = 0 /* initial */; //start again from te beginning
                                }
                                else if (i < dataView.byteLength) {
                                    nextDataLength = currentByte;
                                    if (command >= ergometer.csafe.defs.CTRL_CMD_SHORT_MIN) {
                                        frameState = 6 /* parseCommandData */;
                                    }
                                    else
                                        frameState = 4 /* parseDetailCommand */;
                                }
                                break;
                            }
                            case 4 /* parseDetailCommand */: {
                                detailCommand = currentByte;
                                frameState = 5 /* parseDetailCommandLength */;
                                break;
                            }
                            case 5 /* parseDetailCommandLength */: {
                                nextDataLength = currentByte;
                                frameState = 6 /* parseCommandData */;
                                break;
                            }
                            case 6 /* parseCommandData */: {
                                if (!commandData) {
                                    commandDataIndex = 0;
                                    commandData = new Uint8Array(nextDataLength);
                                }
                                commandData[commandDataIndex] = currentByte;
                                nextDataLength--;
                                commandDataIndex++;
                                if (nextDataLength == 0) {
                                    frameState = 2 /* parseCommand */;
                                    try {
                                        _this.receivedCSaveCommand({
                                            command: command,
                                            detailCommand: detailCommand,
                                            data: commandData
                                        });
                                    }
                                    catch (e) {
                                        _this.handleError(e); //never let the receive crash the main loop
                                    }
                                    commandData = null;
                                    detailCommand = 0;
                                }
                                break;
                            }
                        }
                        if (_this.logLevel == LogLevel.trace)
                            _this.traceInfo("parse: " + i + ": " + ergometer.utils.toHexString(currentByte, 1) + " state: " + frameState + " checksum:" + ergometer.utils.toHexString(calcCheck, 1) + " ");
                        i++;
                    }
                    //when something went wrong, the bluetooth block is endend but the frame not
                    if (dataView.byteLength != ergometer.ble.PACKET_SIZE && frameState != 0 /* initial */) {
                        frameState = 0 /* initial */;
                        _this.handleError("wrong csafe frame ending.");
                    }
                }
            }).catch(this.getErrorHandlerFunc(""));
        };
        Object.defineProperty(PerformanceMonitor.prototype, "csafeBuffer", {
            get: function () {
                var _this = this;
                //init the buffer when needed
                if (!this._csafeBuffer) {
                    this._csafeBuffer = {
                        commands: [],
                        clear: function () {
                            _this.csafeBuffer.rawCommands = [];
                            return _this.csafeBuffer;
                        },
                        send: function (sucess, error) {
                            return _this.sendCSafeBuffer().then(sucess, error);
                        },
                        addRawCommand: function (info) {
                            _this.csafeBuffer.rawCommands.push(info);
                            return _this.csafeBuffer;
                        }
                    };
                    ergometer.csafe.commandManager.apply(this.csafeBuffer, this);
                }
                return this._csafeBuffer;
            },
            enumerable: true,
            configurable: true
        });
        return PerformanceMonitor;
    }());
    ergometer.PerformanceMonitor = PerformanceMonitor;
})(ergometer || (ergometer = {}));

module.exports = ergometer;