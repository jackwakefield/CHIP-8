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

/* jshint nonew:false */
/* global T */
/* exported Sound */

var Sound = (function() {
    "use strict";

    // the default volume multiplier
    var DEFAULT_VOLUME = 0.5;

    // the tone frequency in hertz
    var TONE_FREQUENCY = 490.0;

    // the tone waveform type
    var TONE_WAVE_FORM = 'square';

    // the time in millseconds to play a single step
    var STEP_TIME = 1000 / 60;

    // the single frequency tone
    var tone;

    // the current volume
    var volume;

    // the timer to stop the tone being played after the requested number of steps
    var timer;

    function Sound() {
        tone = new T(TONE_WAVE_FORM, { freq: TONE_FREQUENCY });
        timer = null;

        this.setVolume(DEFAULT_VOLUME);
    }

    Sound.prototype.setVolume = function(value) {
        volume = value;
        tone.set('mul', volume);
    };

    Sound.prototype.mute = function() {
        tone.set('mul', 0.0);
    };

    Sound.prototype.unmute = function() {
        tone.set('mul', volume);
    };

    Sound.prototype.play = function(steps) {
        // if a previous timer has been set, stop playing the current tone and clear the timer
        if (timer !== null) {
            this.stop();
        }

        // play the tone
        tone.play();

        // create a time to play the tone for the required time
        timer = window.setTimeout(this.stop, steps * STEP_TIME);
    };

    Sound.prototype.stop = function() {
        // ensure the timer exists
        if (timer !== null) {
            // clear the timer
            window.clearTimeout(timer);
            timer = null;
        }

        // pause the tone
        tone.pause();
    };

    return Sound;
})();
