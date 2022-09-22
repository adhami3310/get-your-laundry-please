"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Machines = exports.MachineStatus = void 0;
const serialport_1 = require("serialport");
const parser_readline_1 = require("@serialport/parser-readline");
const _1 = require(".");
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
    name;
    count;
    serialPort;
    status;
    history = [];
    lastTransition = [];
    forcedStates = [];
    mapping;
    waiting = [];
    constructor(name, count, path, br, forcedStates, mapping) {
        this.name = name;
        this.count = count;
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
            //console.log(`${this.name}: [${values.join(", ")}]`);
            if (values.length !== this.count) {
                console.log("Expected number of values to match number of machines, check wiring.");
                return;
            }
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
            console.log(`${this.name}[${i}]: ${Math.floor(shortAverage * 100)}, ${Math.floor(historyAverage * 100)}, ${Math.floor(shortValues[shortValues.length - 1] * 100)}, ${machineStatusToString(this.status[i])}`);
        }
    }
    addWaiting(person) {
        if (person.waiting === "specific") {
            if (this.waiting.filter(otherPerson => otherPerson.email === person.email)
                .filter(otherPerson => otherPerson.waiting === "any" || otherPerson.machine === person.machine)
                .length > 0)
                return;
            this.waiting.push({ email: person.email, waiting: "specific", machine: person.machine });
        }
        else {
            this.waiting = this.waiting.filter(otherPerson => otherPerson.email !== person.email);
            this.waiting.push({ email: person.email, waiting: "any" });
        }
    }
    changeStatus(index, newStatus) {
        const outsideIndex = this.mapping.indexOf(index);
        if (newStatus === MachineStatus.OFF) {
            const people = this.waiting.filter(person => person.waiting === "any" || person.machine === outsideIndex);
            this.waiting = this.waiting.filter(person => person.waiting === "specific" && person.machine !== outsideIndex);
            people.forEach(person => {
                if (person.waiting === "any")
                    (0, _1.sendNotification)({ to: person.email, subject: `a ${this.name}` });
                else
                    (0, _1.sendNotification)({ to: person.email, subject: `${this.name} #${outsideIndex}` });
            });
        }
        this.status[index] = newStatus;
        this.lastTransition[index] = Date.now();
    }
}
exports.Machines = Machines;
//# sourceMappingURL=Machines.js.map