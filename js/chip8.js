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
/* global Memory, Display, Input, Sound */
/* exported Chip8 */

var Chip8 = (function() {
    "use strict";

    // the number frames per second to render at
    var FRAMES_PER_SECOND = 60;

    // the number steps to execute per frame
    var STEPS_PER_FRAME = 12;

    // the size of an instruction in bytes
    var INSTRUCTION_SIZE = 2;

    // the number of registers
    var REGISTER_COUNT = 16;

    // the memory offset where the ROM is stored
    var ROM_OFFSET = 0x200;

    // the emulator components
    var memory, display, input, sound;

    // the registers
    var registers, indexRegister, delayTimer, soundTimer, programCounter, stack;

    // determines whether the emulator is active and should be cycled
    var active;

    // the 2D canvas context
    var context;

    // determines whether the emulator is waiting for a key to be pressed
    var awaitingKeyPress;

    function Chip8(target) {
        // retrieve the 2D context of the target canvas
        context = target.getContext('2d');

        // initialise the emulator components
        memory = new Memory();
        display = new Display();
        input = new Input();
        sound = new Sound();

        // reset the emulator state
        this.reset();
    }

    Chip8.prototype.reset = function() {
        // reset the memory buffer
        memory.reset();

        // write the hexadecimal text sprites to memory and clear the display
        display.writeSpritesToMemory(memory);
        display.clear();

        // ensure the audio component isn't running
        sound.stop();

        // clear the registers and stack
        registers = new Uint8Array(REGISTER_COUNT);
        indexRegister = 0;
        delayTimer = 0;
        soundTimer = 0;
        programCounter = ROM_OFFSET;
        stack = [];

        // prevent the emulator from cycling
        active = false;

        // reset the awaiting key press state
        awaitingKeyPress = false;
    };

    Chip8.prototype.loadRom = function(href) {
        // reset the emulator state
        this.reset();

        // create the async request to load the ROM from the specified href returning an array
        // buffer to be loaded into memory
        var xhr = new XMLHttpRequest();
        xhr.open('GET', href + '?' + (Math.random() * 1000000), true);
        xhr.responseType = 'arraybuffer';

        xhr.onload = function() {
            // ensure the ROM was retrieved successfully
            if (this.status === 200) {
                // create a byte array from the array buffer response and write it to memory at the
                // ROM offset
                var array = new Uint8Array(this.response);
                memory.writeBytes(ROM_OFFSET, array);

                // set the emulator to active to start cycling
                active = true;
            }
        };

        xhr.send();
    };

    Chip8.prototype.mute = function() {
        sound.mute();
    };

    Chip8.prototype.unmute = function() {
        sound.unmute();
    };

    Chip8.prototype.run = function() {
        // start the update and render cycle
        window.setInterval(function() {
            // ensure the emulator is running
            if (active) {
                // determine whether an instruction is waiting for a key to be pressed
                if (awaitingKeyPress !== false) {
                    // retrieve the current active key
                    var activeKey = input.getActiveKey();

                    // process the input component to reset the key pressed states
                    input.process();

                    // ensure an active key exists
                    if (activeKey !== null) {
                        // set the requested register to the active key value and reset the
                        // awaiting key press state
                        registers[awaitingKeyPress] = activeKey;
                        awaitingKeyPress = false;
                    }
                } else { // ensure the delay time isn't active
                    // run the required number of steps per frame
                    for (var i = 0; i < STEPS_PER_FRAME; i++) {
                        this.step();

                        // process the input component to reset the key pressed states
                        input.process();
                    }

                    // output the display to the canvas context
                    display.render(context);
                }

                if (delayTimer > 0) {
                    delayTimer--;
                }

                if (soundTimer > 0) {
                    soundTimer--;
                }
            }
        }.bind(this), 1000 / FRAMES_PER_SECOND);
    };

    Chip8.prototype.step = function() {
        // declare the common variables used for various instructions
        var register, registerA, registerB, value, i;

        // read the current opcode from memory at the program counter position
        var opcode = memory.readShort(programCounter);

        // increase the program counter position by the size of a single instruction
        programCounter += INSTRUCTION_SIZE;

        switch (opcode & 0xF000) {
            case 0x0000:
                switch (opcode & 0x00FF) {
                    case 0x00E0: // 00E0
                        // clear the display
                        display.clear();
                        break;
                    case 0x00EE: // 00EE
                        // return from a subroutine
                        programCounter = stack.pop();
                        break;
                }
                break;
            case 0x1000: // 1nnn
                // jump to address nnn
                programCounter = opcode & 0x0FFF;
                break;
            case 0x2000: // 2nnn
                // call subroutine at address nnn
                stack.push(programCounter);
                programCounter = opcode & 0x0FFF;
                break;
            case 0x3000: // 3xkk
                // skip the next instruction if V[x] is equal to kk
                register = (opcode & 0x0F00) >> 8;
                value = opcode & 0x00FF;

                if (registers[register] === value) {
                    programCounter += INSTRUCTION_SIZE;
                }
                break;
            case 0x4000: // 4xkk
                // skip the next instruction if V[x] is not equal to kk
                register = (opcode & 0x0F00) >> 8;
                value = opcode & 0x00FF;

                if (registers[register] !== value) {
                    programCounter += INSTRUCTION_SIZE;
                }
                break;
            case 0x5000: // 5xy0
                // skip the next instruction if V[x] is equal to V[y]
                registerA = (opcode & 0x0F00) >> 8;
                registerB = (opcode & 0x00F0) >> 4;

                if (registers[registerA] === registers[registerB]) {
                    programCounter += INSTRUCTION_SIZE;
                }
                break;
            case 0x6000: // 6xkk
                // set V[x] to kk
                register = (opcode & 0x0F00) >> 8;
                registers[register] = opcode & 0x00FF;
                break;
            case 0x7000: // 7xkk
                // add kk to V[x]
                register = (opcode & 0x0F00) >> 8;
                registers[register] = (registers[register] + (opcode & 0x00FF)) & 0xFF;
                break;
            case 0x8000:
                registerA = (opcode & 0x0F00) >> 8;
                registerB = (opcode & 0x00F0) >> 4;

                switch (opcode & 0x000F) {
                    case 0x0000: // 8xy0
                        // set V[x] to V[y]
                        registers[registerA] = registers[registerB];
                        break;
                    case 0x0001: // 8xy1
                        // OR V[x] by V[y]
                        registers[registerA] |= registers[registerB];
                        break;
                    case 0x0002: // 8xy2
                        // AND V[x] by V[y]
                        registers[registerA] &= registers[registerB];
                        break;
                    case 0x0003: // 8xy3
                        // XOR V[x] by V[y]
                        registers[registerA] ^= registers[registerB];
                        break;
                    case 0x0004: // 8xy4
                        // add V[y] to V[x], set VF to the carry flag
                        value = registers[registerA] + registers[registerB];
                        registers[registerA] = value & 0xFF;
                        registers[0xF] = value > 0xFF ? 1 : 0;
                        break;
                    case 0x0005: // 8xy5
                        // set VF to the borrow flag if V[x] is more than V[y] and then subtract
                        // V[y] from V[x],
                        registers[0xF] = registers[registerA] > registers[registerB] ? 1 : 0;
                        registers[registerA] = (registers[registerA] - registers[registerB]) & 0xFF;
                        break;
                    case 0x0006: // 8xy6
                        // set VF to the borrow flag if the least-significant bit of V[x] is 1, then
                        // then shift-right V[x] by 1
                        registers[0xF] = registers[registerA] & 0x1;
                        registers[registerA] = (registers[registerA] >> 1) & 0xFF;
                        break;
                    case 0x0007: // 8xy7
                        // set VF to the borrow flag if V[y] is more than V[x], then subtract V[x]
                        // from V[y] and store the result in V[x]
                        registers[0xF] = registers[registerB] > registers[registerA] ? 1 : 0;
                        registers[registerA] = (registers[registerB] - registers[registerA]) & 0xFF;
                        break;
                    case 0x000E: // 8xyE
                        // set VF to the borrow flag if the most-significant bit of V[x] is 1, then
                        // then shift-left V[x] by 1
                        registers[0xF] = (registers[registerA] & 0x80) !== 0 ? 1 : 0;
                        registers[registerA] = (registers[registerA] << 1) & 0xFF;
                        break;
                }
                break;
            case 0x9000: // 9xy0
                // skip the next instruction is V[x] does not equal V[y]
                registerA = (opcode & 0x0F00) >> 8;
                registerB = (opcode & 0x00F0) >> 4;

                if (registers[registerA] !== registers[registerB]) {
                    programCounter += INSTRUCTION_SIZE;
                }
                break;
            case 0xA000: // Annn
                // set I to nnn
                indexRegister = opcode & 0x0FFF;
                break;
            case 0xB000: // Bnnn
                // jump to nnn plus V[0]
                value = opcode & 0x0FFF;
                programCounter = registers[0] + value;
                break;
            case 0xC000: // Cxkk
                // set V[x] to a random byte AND kk
                register = (opcode & 0x0F00) >> 8;
                value = opcode & 0x00FF;
                registers[register] = ((Math.random() * 0xFF) | 0) & value;
                break;
            case 0xD000: // Dxyn
                registerA = (opcode & 0x0F00) >> 8;
                registerB = (opcode & 0x00F0) >> 4;
                value = opcode & 0x000F;

                var x = registers[registerA];
                var y = registers[registerB];
                registers[0xF] = 0;

                for (i = 0; i < value; i++) {
                    var spriteRow = memory.readByte(indexRegister + i);

                    if (display.setRow(x, y + i, spriteRow)) {
                        registers[0xF] = 1;
                    }
                }
                break;
            case 0xE000:
                register = (opcode & 0x0F00) >> 8;
                value = registers[register];

                switch (opcode & 0x00FF) {
                    case 0x009E: // Ex9E
                        // skip the next instruction if key with the value of V[x] is pressed
                        if (input.isKeyPressed(value)) {
                            programCounter += INSTRUCTION_SIZE;
                        }
                        break;
                    case 0x00A1: // ExA1
                        // skip the next instruction if key with the value of V[x] is not pressed
                        if (!input.isKeyPressed(value)) {
                            programCounter += INSTRUCTION_SIZE;
                        }
                        break;
                }
                break;
            case 0xF000:
                switch (opcode & 0x00FF) {
                    case 0x0007: // Fx07
                        // set V[x] to the delay timer value
                        register = (opcode & 0x0F00) >> 8;
                        registers[register] = delayTimer & 0xFF;
                        break;
                    case 0x000A: // Fx0A
                        // wait for a key press and then store the value of the key in V[x]
                        register = (opcode & 0x0F00) >> 8;
                        awaitingKeyPress = register;
                        break;
                    case 0x0015: // Fx15
                        // set the delay timer value to V[x]
                        register = (opcode & 0x0F00) >> 8;
                        delayTimer = registers[register];
                        break;
                    case 0x0018: // Fx18
                        // set the sound timer to V[x]
                        register = (opcode & 0x0F00) >> 8;
                        soundTimer = registers[register];
                        sound.play(soundTimer);
                        break;
                    case 0x001E: // Fx1E
                        // add V[x] to I
                        register = (opcode & 0x0F00) >> 8;
                        indexRegister += registers[register];
                        break;
                    case 0x0029: // Fx29
                        // set I to the offset of sprite for digit V[x]
                        register = (opcode & 0x0F00) >> 8;
                        value = registers[register] & 0xF;

                        indexRegister = display.getSpriteOffset(value);
                        break;
                    case 0x0033: // Fx33
                        // store BCD representation of V[x] in memory locations I, I+1, and I+2
                        register = (opcode & 0x0F00) >> 8;
                        value = registers[register];

                        // OR each value by 0 to round down quickly
                        memory.writeByte(indexRegister, (value / 100) | 0);
                        memory.writeByte(indexRegister + 1, ((value / 10) | 0) % 10);
                        memory.writeByte(indexRegister + 2, (value % 100) % 10);
                        break;
                    case 0x0055: // Fx55
                        // store registers V[0] through V[x] in memory starting at location I
                        value = (opcode & 0x0F00) >> 8;

                        for (i = 0; i <= value; i++) {
                            memory.writeByte(indexRegister + i, registers[i]);
                        }
                        break;
                    case 0x0065: // Fx65
                        // read registers V[0] through V[x] from memory starting at location I
                        value = (opcode & 0x0F00) >> 8;

                        for (i = 0; i <= value; i++) {
                            registers[i] = memory.readByte(indexRegister + i);
                        }
                        break;
                }
                break;
        }
    };

    return Chip8;
})();
