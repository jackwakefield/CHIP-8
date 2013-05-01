/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/* jshint bitwise:false */
/* exported Memory */

var Memory = (function() {
    "use strict";

    // the memory size in bytes
    var MEMORY_SIZE = 7096;

    // the memory buffer
    var buffer;

    function Memory() {
        // reset the memory buffer
        this.reset();
    }

    Memory.prototype.reset = function() {
        // initialise the buffer using the memory size
        buffer = new Uint8Array(MEMORY_SIZE);
    };

    Memory.prototype.writeByte = function(offset, value) {
        buffer[offset] = value & 0xFF;
    };

    Memory.prototype.writeBytes = function(offset, values) {
        buffer.set(values, offset);
    };

    Memory.prototype.readByte = function(offset) {
        return buffer[offset];
    };

    Memory.prototype.readShort = function(offset) {
        return buffer[offset] << 8 | buffer[offset + 1];
    };

    return Memory;
})();
