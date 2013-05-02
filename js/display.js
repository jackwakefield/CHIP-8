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
/* exported Display */

var Display = (function() {
    "use strict";

    // the display dimensions
    var DISPLAY_WIDTH = 64,
        DISPLAY_HEIGHT = 32;

    // the default scale value
    var DEFAULT_SCALE = 8;

    // the built-in sprite data
    var sprites = {
        0x0: {
            offset: 0x050,
            data: [0xF0, 0x90, 0x90, 0x90, 0xF0]
        },
        0x1: {
            offset: 0x055,
            data: [0x20, 0x60, 0x20, 0x20, 0x70]
        },
        0x2: {
            offset: 0x05A,
            data: [0xF0, 0x10, 0xF0, 0x80, 0xF0]
        },
        0x3: {
            offset: 0x05F,
            data: [0xF0, 0x10, 0xF0, 0x10, 0xF0]
        },
        0x4: {
            offset: 0x064,
            data: [0x90, 0x90, 0xF0, 0x10, 0x10]
        },
        0x5: {
            offset: 0x069,
            data: [0xF0, 0x80, 0xF0, 0x10, 0xF0]
        },
        0x6: {
            offset: 0x06E,
            data: [0xF0, 0x80, 0xF0, 0x90, 0xF0]
        },
        0x7: {
            offset: 0x073,
            data: [0xF0, 0x10, 0x20, 0x40, 0x40]
        },
        0x8: {
            offset: 0x078,
            data: [0xF0, 0x90, 0xF0, 0x90, 0xF0]
        },
        0x9: {
            offset: 0x07D,
            data: [0xF0, 0x90, 0xF0, 0x10, 0xF0]
        },
        0xA: {
            offset: 0x082,
            data: [0xF0, 0x90, 0xF0, 0x90, 0x90]
        },
        0xB: {
            offset: 0x087,
            data: [0xE0, 0x90, 0xE0, 0x90, 0xE0]
        },
        0xC: {
            offset: 0x08C,
            data: [0xF0, 0x80, 0x80, 0x80, 0xF0]
        },
        0xD: {
            offset: 0x091,
            data: [0xE0, 0x90, 0x90, 0x90, 0xE0]
        },
        0xE: {
            offset: 0x096,
            data: [0xF0, 0x80, 0xF0, 0x80, 0xF0]
        },
        0xF: {
            offset: 0x09B,
            data: [0xF0, 0x80, 0xF0, 0x80, 0x80]
        }
    };

    // the scale to apply when rendering
    var scale;

    // the current pixel values
    var pixels;

    // modifications made since the last render
    var modifications = {};

    function Display() {
        // create the pixel buffer and clear the screen
        pixels = new Uint8Array(DISPLAY_WIDTH * DISPLAY_HEIGHT);
        this.clear();

        // set the default scale value
        this.setScale(DEFAULT_SCALE);
    }

    Display.prototype.setScale = function(value) {
        // set the scale value and invalidate the pixel buffer
        scale = value;
        this.invalidate();
    };

    Display.prototype.clear = function() {
        // reset each pixel to the initial value
        for (var i = 0; i < pixels.length; i++) {
            pixels[i] = 0;
        }

        // add each pixel to the modification list
        this.invalidate();
    };

    Display.prototype.invalidate = function() {
        // add each pixel to the modification list
        for (var i = 0; i < pixels.length; i++) {
            modifications[i] = pixels[i];
        }
    };

    Display.prototype.writeSpritesToMemory = function(memory) {
        // loop through each sprite
        for (var value in sprites) {
            if (sprites.hasOwnProperty(value)) {
                var sprite = sprites[value];

                // write each sprite row to memory
                for (var i = 0; i < sprite.data.length; i++) {
                    memory.writeByte(sprite.offset + i, sprite.data[i]);
                }
            }
        }
    };

    Display.prototype.getSpriteOffset = function(value) {
        // determine whether a sprite for the specified value exists
        if (sprites.hasOwnProperty(value)) {
            // return the sprite offset
            return sprites[value].offset;
        }

        return 0;
    };

    Display.prototype.getIndex = function(x, y) {
        // wrap the given coordinates within the display dimensions
        x = x % DISPLAY_WIDTH;
        y = y % DISPLAY_HEIGHT;

        return y * DISPLAY_WIDTH + x;
    };

    Display.prototype.getPixel = function(x, y) {
        // retrieve the pixel index for the given coordinates
        var index = this.getIndex(x, y);

        return pixels[index];
    };

    Display.prototype.togglePixel = function(x, y) {
        // retrieve the pixel index for the given coordinates
        var index = this.getIndex(x, y);

        // toggle the specified pixel and add the new pixel value to the modification list
        pixels[index] ^= 1;
        modifications[index] = pixels[index];
    };

    Display.prototype.setRow = function(x, y, value) {
        var collision = false;

        // ensure the row doesn't exceed the height of the display
        if (y < DISPLAY_HEIGHT) {
            // loop through eacb bit of the given value
            for (var i = 0; i < 8; i++) {
                // ensure the horizontal position is not outside of the screen and that the current
                // bit isn't zero
                if (x < DISPLAY_WIDTH && (value & (0x80 >> i)) !== 0) {
                    // determine whether the current pixel is currently set, if so record it as a
                    // collision
                    if (this.getPixel(x, y) === 1) {
                        collision = true;
                    }

                    // toggle the current pixel state
                    this.togglePixel(x, y);
                }

                x++;
            }
        }

        return collision;
    };

    Display.prototype.render = function(context) {
        var x, y;

        // loop through each modification
        for (var index in modifications) {
            if (modifications.hasOwnProperty(index)) {
                // retrieve the coordinates from the modification index
                x = index % DISPLAY_WIDTH;
                y = index / DISPLAY_WIDTH | 0;

                // set the fill colour based on the pixel state
                if (modifications[index] === 0) {
                    context.fillStyle = '#779400';
                } else {
                    context.fillStyle = '#282c06';
                }

                // draw a rectangle for the current pixel scaling the coordinates and dimensions
                context.fillRect(x * scale, y * scale, scale, scale);
            }
        }

        // clear the modifications
        modifications = {};
    };

    return Display;
})();
