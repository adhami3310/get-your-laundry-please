"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Machines = exports.MachineStatus = void 0;
const serialport_1 = require("serialport");
const parser_readline_1 = require("@serialport/parser-readline");
const assert_1 = __importDefault(require("assert"));
var MachineStatus;
(function (MachineStatus) {
    MachineStatus[MachineStatus["ON"] = 0] = "ON";
    MachineStatus[MachineStatus["OFF"] = 1] = "OFF";
    MachineStatus[MachineStatus["BROKEN"] = 2] = "BROKEN";
})(MachineStatus = exports.MachineStatus || (exports.MachineStatus = {}));
;
class Machines {
    constructor(count, path, br) {
        this.buffer = "";
        this.serialPort = new serialport_1.SerialPort({ path: path, baudRate: br });
        this.status = Array(count).fill(MachineStatus.OFF);
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
        console.log("what does the machine say?", firstLine);
        const values = firstLine.split(" ").map(val => parseFloat(val));
    }
}
exports.Machines = Machines;
//# sourceMappingURL=Machines.js.map