"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Machines = exports.MachineStatus = void 0;
const serialport_1 = require("serialport");
const parser_readline_1 = require("@serialport/parser-readline");
const assert_1 = __importDefault(require("assert"));
const HISTORY_TIME = 60000; //number of milliseconds to use to change data from ON to OFF
const SHORT_TIME = 30000; //number of milliseconds to use to change data from OFF to ON
const LUDICROUS_CURRENT = 40; // above this the machine is acting weird and prob sth happened wrong
const ON_THRESHOLD = 1; //the threshold to become ON
const OFF_THRESHOLD = 0.7; //the threshold to become OFF
var MachineStatus;
(function (MachineStatus) {
    MachineStatus[MachineStatus["ON"] = 0] = "ON";
    MachineStatus[MachineStatus["OFF"] = 1] = "OFF";
    MachineStatus[MachineStatus["BROKEN"] = 2] = "BROKEN";
    MachineStatus[MachineStatus["NOIDEA"] = 3] = "NOIDEA";
    MachineStatus[MachineStatus["NONE"] = 4] = "NONE";
})(MachineStatus = exports.MachineStatus || (exports.MachineStatus = {}));
;
function machineStatusToString(status) {
    if (status === MachineStatus.ON)
        return "ON";
    if (status === MachineStatus.OFF)
        return "OFF";
    if (status === MachineStatus.BROKEN)
        return "BROKEN";
    return "UNKNOWN";
}
class Machines {
    constructor(name, count, path, br, forcedStates, mapping) {
        this.name = name;
        this.count = count;
        this.history = [];
        this.lastTransition = [];
        this.forcedStates = [];
        this.status = Array(count).fill(MachineStatus.NOIDEA);
        this.lastTransition = Array(count).fill(Date.now());
        forcedStates.forEach((state, i) => {
            if (state !== MachineStatus.NONE) {
                this.status[i] = state;
            }
        });
        this.mapping = [...mapping];
        this.serialPort = new serialport_1.SerialPort({ path: path, baudRate: br });
        let parser = this.serialPort.pipe(new parser_readline_1.ReadlineParser({ delimiter: '\n' }));
        this.serialPort.on("open", () => {
            console.log("opened");
        });
        this.forcedStates = [...forcedStates];
        let self = this;
        parser.on("data", data => {
            self.onData(data);
        });
    }
    getStatus() {
        return this.status.map((_, i) => this.status[this.mapping[i]]);
    }
    getStatusString() {
        return this.getStatus().map(status => machineStatusToString(status)).join(" ");
    }
    getLastTransition() {
        return this.lastTransition.map((_, i) => this.lastTransition[this.mapping[i]]);
    }
    sinceTransition() {
        const timeNow = Date.now();
        return this.getLastTransition().map(value => Math.floor(timeNow - value));
    }
    toJSON() {
        return {
            count: this.count,
            name: this.name,
            path: this.serialPort.path,
            baudRate: this.serialPort.baudRate,
            status: this.getStatus().map(status => machineStatusToString(status)),
            sinceTransition: this.sinceTransition(),
            lastTransition: this.getLastTransition()
        };
    }
    toString() {
        return `${this.name}: ${this.getStatus()}`;
    }
    onData(data) {
        const receivedTime = Date.now();
        for (const line of data.split("\n")) {
            const values = line.split(" ").map(val => parseFloat(val)).filter(value => !Number.isNaN(value));
            if (values.length === 0)
                continue;
            console.log(`${this.name}: [${values.join(", ")}]`);
            assert_1.default.strictEqual(values.length, this.count, "Expected number of values to match number of machines, check wiring.");
            this.history.push({ values: values, time: receivedTime });
            this.updateStatus();
        }
    }
    updateStatus() {
        const currentTime = Date.now();
        this.history = this.history.filter(record => (currentTime - record.time <= HISTORY_TIME));
        for (let i = 0; i < this.status.length; i++) {
            const currentStatus = this.status[i];
            if (currentStatus === MachineStatus.BROKEN || this.forcedStates[i] != MachineStatus.NONE)
                continue;
            const historyValues = this.history
                .map(record => record.values[i])
                .map(value => value !== undefined ? value : NaN)
                .filter(value => !Number.isNaN(value) && value <= LUDICROUS_CURRENT);
            const shortValues = this.history
                .filter(record => currentTime - record.time <= SHORT_TIME)
                .map(record => record.values[i])
                .map(value => value !== undefined ? value : NaN)
                .filter(value => !Number.isNaN(value) && value <= LUDICROUS_CURRENT);
            if (historyValues.length == 0 || shortValues.length == 0) {
                this.changeStatus(i, MachineStatus.NOIDEA);
                continue;
            }
            const historyAverage = historyValues.reduce((a, b) => a + b, 0) / historyValues.length;
            const shortAverage = shortValues.reduce((a, b) => a + b, 0) / shortValues.length;
            console.log(`${this.name}[${i}]: ${Math.floor(shortAverage * 100)} and ${Math.floor(historyAverage * 100)}`);
            if (currentStatus === MachineStatus.NOIDEA) {
                if (shortAverage >= ON_THRESHOLD) {
                    this.changeStatus(i, MachineStatus.ON);
                }
                else if (historyAverage <= OFF_THRESHOLD) {
                    this.changeStatus(i, MachineStatus.OFF);
                }
            }
            else if (currentStatus === MachineStatus.OFF) {
                if (shortAverage >= ON_THRESHOLD) {
                    this.changeStatus(i, MachineStatus.ON);
                }
            }
            else if (currentStatus === MachineStatus.ON) {
                if (shortAverage <= OFF_THRESHOLD && historyAverage <= OFF_THRESHOLD) {
                    this.changeStatus(i, MachineStatus.OFF);
                }
            }
        }
    }
    changeStatus(index, newStatus) {
        this.status[index] = newStatus;
        this.lastTransition[index] = Date.now();
    }
}
exports.Machines = Machines;
//# sourceMappingURL=Machines.js.map