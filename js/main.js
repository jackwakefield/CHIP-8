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

/* global $, Chip8 */

$(function() {
    "use strict";

    $('.selectpicker').selectpicker();
    $('[rel=tooltip]').tooltip();
    $('[rel=popover]').popover();

    // set a submit event for the load game form
    $('#load-game-form').submit(function() {
        // get the game select control and retrieve the game href
        var $gameSelector = $('#game-selector');
        var href = $gameSelector.val();

        // ensure the href isn't empty
        if (href.length > 0) {
            // load the requested ROM
            emulator.loadRom(href);
        }

        // handle the form submission
        return false;
    });

    // retrieve the target canvas
    var target = document.getElementById('target');

    // create an emulator instance using the target canvas as the target
    var emulator = new Chip8(target);
    emulator.run();

    // retrieve the toggle sound button used to unmute and mute the sound
    var $toggleSound = $('#toggle-sound');

    // determine whether a sound state cookie exists
    if ($.cookie('sound-state') === 'disabled') {
        // mute the sound as it was previously muted
        emulator.mute();
    } else {
        // set the toggle sound button to active as sound is enabled
        $toggleSound.button('toggle');
    }

    // set a click event on the toggle sound button fired before the toggle state is changed
    $toggleSound.click(function() {
        // determine the previous sound state from the current classes
        var previouslyEnabled = $(this).hasClass('active');

        // set the sound state cookie depending on the current classes
        $.cookie('sound-state', previouslyEnabled ? 'disabled' : 'enabled');

        if (previouslyEnabled) {
            emulator.mute();
        } else {
            emulator.unmute();
        }
    });
});
