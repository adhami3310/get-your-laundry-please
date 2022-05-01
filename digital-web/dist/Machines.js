"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Machines = exports.MachineStatus = void 0;
const serialport_1 = require("serialport");
const parser_readline_1 = require("@serialport/parser-readline");
const assert_1 = __importDefault(require("assert"));
const HISTORY_TIME = 60; //number of seonds to use to change data from ON to OFF
const SHORT_TIME = 30; //number of seonds to use to change data from OFF to ON
const DELAY = 2; // number of seconds between two incoming inputs from the arduino
const LUDICROUS_CURRENT = 40; // above this the machine is acting weird and prob sth happened wrong
const ON_THRESHOLD = 1; //the threshold to become ON
const OFF_THRESHOLD = 1; //the threshold to become OFF
const SIGNFIFICANT_RATIO = 1 / 2; //the minimum threshold of data present in the last time
var MachineStatus;
(function (MachineStatus) {
    MachineStatus[MachineStatus["ON"] = 0] = "ON";
    MachineStatus[MachineStatus["OFF"] = 1] = "OFF";
    MachineStatus[MachineStatus["BROKEN"] = 2] = "BROKEN";
    MachineStatus[MachineStatus["NOIDEA"] = 3] = "NOIDEA";
})(MachineStatus = exports.MachineStatus || (exports.MachineStatus = {}));
;
class Machines {
    constructor(name, count, path, br) {
        this.name = name;
        this.buffer = "";
        this.history = [];
        this.serialPort = new serialport_1.SerialPort({ path: path, baudRate: br });
        this.status = Array(count).fill(MachineStatus.NOIDEA);
        let parser = this.serialPort.pipe(new parser_readline_1.ReadlineParser({ delimiter: '\n' }));
        this.serialPort.on("open", () => {
            console.log("opened");
        });
        let self = this;
        parser.on("data", data => {
            self.onData(data);
        });
    }
    getStatus() {
        return [...this.status];
    }
    toString() {
        return this.status.map((status) => {
            if (status === MachineStatus.ON)
                return "ON";
            if (status === MachineStatus.OFF)
                return "OFF";
            if (status === MachineStatus.NOIDEA)
                return "NOIDEA";
            return "BROKEN";
        }).join(" ");
    }
    onData(data) {
        this.buffer += data + "\n";
        const lines = this.buffer.split("\n");
        if (lines.length === 1)
            return; //return until a full line has been received
        const firstLine = lines[0];
        (0, assert_1.default)(firstLine !== undefined);
        this.buffer = lines.slice(1).join("\n");
        console.log(`${this.name}: ${firstLine}`);
        const values = firstLine.split(" ").map(val => parseFloat(val));
        this.history.push(values);
        for (let i = 0; i < this.status.length; i++) {
            const currentStatus = this.status[i];
            if (currentStatus === MachineStatus.BROKEN)
                continue;
            const historyValues = [];
            const shortValues = [];
            for (let j = Math.max(0, Math.floor(this.history.length - HISTORY_TIME / DELAY)); j < this.history.length; j++) {
                const value = this.history[j][i];
                if (value !== undefined && value != NaN && value <= LUDICROUS_CURRENT)
                    historyValues.push(value);
            }
            for (let j = Math.max(0, Math.floor(this.history.length - SHORT_TIME / DELAY)); j < this.history.length; j++) {
                const value = this.history[j][i];
                if (value !== undefined && value != NaN && value <= LUDICROUS_CURRENT)
                    shortValues.push(value);
            }
            if (historyValues.length == 0 || shortValues.length == 0) {
                this.changeStatus(i, MachineStatus.NOIDEA);
                continue;
            }
            const historyAverage = historyValues.reduce((a, b) => a + b, 0) / historyValues.length;
            const shortAverage = shortValues.reduce((a, b) => a + b, 0) / shortValues.length;
            if (currentStatus === MachineStatus.NOIDEA) {
                if (shortAverage >= ON_THRESHOLD && shortValues.length * DELAY >= SIGNFIFICANT_RATIO * SHORT_TIME) {
                    this.changeStatus(i, MachineStatus.ON);
                }
                else if (historyAverage <= OFF_THRESHOLD && historyValues.length * DELAY >= SIGNFIFICANT_RATIO * HISTORY_TIME) {
                    this.changeStatus(i, MachineStatus.OFF);
                }
            }
            else if (currentStatus === MachineStatus.OFF) {
                if (shortAverage >= ON_THRESHOLD && shortValues.length * DELAY >= SIGNFIFICANT_RATIO * SHORT_TIME) {
                    this.changeStatus(i, MachineStatus.ON);
                }
            }
            else if (currentStatus === MachineStatus.ON) {
                if (shortAverage <= OFF_THRESHOLD && historyAverage <= OFF_THRESHOLD && historyValues.length * DELAY >= SIGNFIFICANT_RATIO * HISTORY_TIME) {
                    this.changeStatus(i, MachineStatus.OFF);
                }
            }
        }
    }
    changeStatus(index, newStatus) {
        this.status[index] = newStatus;
    }
}
exports.Machines = Machines;
//# sourceMappingURL=Machines.js.map