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

/* exported Input */

var Input = (function() {
    "use strict";

    // declare the emulator key values and the key codes which activate them
    var keyCodes = {
        0x1: 49 /* 1 */, 0x2: 50 /* 2 */, 0x3: 51 /* 3 */, 0xC: 52 /* 4 */,
        0x4: 81 /* Q */, 0x5: 87 /* W */, 0x6: 69 /* E */, 0xD: 82 /* R */,
        0x7: 65 /* A */, 0x8: 83 /* S */, 0x9: 68 /* D */, 0xE: 69 /* F */,
        0xA: 90 /* Z */, 0x0: 88 /* X */, 0xB: 67 /* C */, 0xF: 86 /* V */
    };

    // the key states for the current step
    var keyStates;

    // the actual key states set immediately when the events are fired to be applied when the input
    // component is processed
    var actualKeyStates;

    function Input() {
        // reset the input state
        this.reset();

        // create the on key down event
        window.onkeydown = function(event) {
            this.onKeyDown(event);
        }.bind(this);

        // create the on key up event
        window.onkeyup = function(event) {
            this.onKeyUp(event);
        }.bind(this);
    }

    Input.prototype.reset = function() {
        // clear the current and actual key states
        keyStates = [];
        actualKeyStates = [];

        // set an initial current and actual key state for each key value
        for (var keyValue in keyCodes) {
            if (keyCodes.hasOwnProperty(keyValue)) {
                var keyCode = keyCodes[keyValue];
                keyStates[keyCode] = false;
                actualKeyStates[keyCode] = false;
            }
        }
    };

    Input.prototype.process = function() {
        // loop through each current key state replacing the current state with the actual key state
        // which is set immediately when the event is fired
        for (var keyCode in keyStates) {
            if (keyStates.hasOwnProperty(keyCode) && actualKeyStates.hasOwnProperty(keyCode)) {
                keyStates[keyCode] = actualKeyStates[keyCode];
            }
        }
    };

    Input.prototype.getKeyValueByCode = function(keyCode) {
        // loop through each key value trying to find a match for the given key code
        for (var keyValue in keyCodes) {
            if (keyCodes.hasOwnProperty(keyValue) && keyCodes[keyValue] === keyCode) {
                return keyValue;
            }
        }

        return null;
    };

    Input.prototype.getKeyStateByValue = function(keyValue) {
        // ensure a key code exists for the specified key value
        if (keyCodes.hasOwnProperty(keyValue)) {
            var keyCode = keyCodes[keyValue];

            // ensure a key state for the key code and return the current key state
            if (keyStates.hasOwnProperty(keyCode)) {
                return keyStates[keyCode];
            }
        }

        return false;
    };

    Input.prototype.onKeyDown = function(event) {
        // set the current and actual key state to active
        keyStates[event.keyCode] = true;
        actualKeyStates[event.keyCode] = true;
    };

    Input.prototype.onKeyUp = function(event) {
        // set the actual key state to inactive, this will be applied the next CPU cycle when the
        // input component is processed
        actualKeyStates[event.keyCode] = false;
    };

    Input.prototype.isKeyPressed = function(keyValue) {
        // determine whether the key state for the given key value is active
        return this.getKeyStateByValue(keyValue) === true;
    };

    Input.prototype.getActiveKey = function() {
        // loop through each key state attempting to find an active key
        for (var keyCode in keyStates) {
            if (keyStates.hasOwnProperty(keyCode) && keyStates[keyCode] === true) {
                // retrieve the emulator key value for the active key code, convert the key code
                // to a string as JavaScript object names are strings regardless of their set value
                return this.getKeyValueByCode(keyCode.toString());
            }
        }

        return null;
    };

    return Input;
})();
