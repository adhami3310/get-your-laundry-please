import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import assert from 'assert';

const HISTORY_TIME = 60; //number of seonds to use to change data from ON to OFF
const SHORT_TIME = 30; //number of seonds to use to change data from OFF to ON
const DELAY = 3.5; // number of seconds between two incoming inputs from the arduino
const LUDICROUS_CURRENT = 40; // above this the machine is acting weird and prob sth happened wrong
const ON_THRESHOLD = 1; //the threshold to become ON
const OFF_THRESHOLD = 1; //the threshold to become OFF
const SIGNFIFICANT_RATIO = 1 / 2; //the minimum threshold of data present in the last time

export enum MachineStatus {
    ON, OFF, BROKEN, NOIDEA
};

export class Machines {
    private readonly serialPort: SerialPort;
    private buffer: string = "";
    private readonly status: Array<MachineStatus>;
    private readonly history: Array<Array<number>> = [];

    public constructor(public readonly name: string, public readonly count: number, path: string, br: number) {
        this.serialPort = new SerialPort({ path: path, baudRate: br });
        this.status = Array(count).fill(MachineStatus.NOIDEA);
        let parser = this.serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));
        this.serialPort.on("open", () => {
            console.log("opened");
        });
        let self = this;
        parser.on("data", data => {
            self.onData(data);
        });
    }

    public getStatus(): Array<MachineStatus> {
        return [...this.status];
    }

    public getStatusString(): string {
        return this.status.map((status) => {
            if (status === MachineStatus.ON) return "ON";
            if (status === MachineStatus.OFF) return "OFF";
            if (status === MachineStatus.NOIDEA) return "NOIDEA";
            return "BROKEN";
        }).join(" ");
    }

    public toJSON(): Object {
        return {
            count: this.count,
            name: this.name,
            path: this.serialPort.path,
            baudRate: this.serialPort.baudRate,
            status: this.getStatus()
        }
    }

    public toString(): string {
        return `${this.name}: ${this.getStatus()}`;
    }

    private onData(data: any): void {
        this.buffer += data + "\n";
        const lines = this.buffer.split("\n");
        if (lines.length === 1) return; //return until a full line has been received
        const firstLine = lines[0];
        assert(firstLine !== undefined);
        this.buffer = lines.slice(1).join("\n");
        const values = firstLine.split(" ").map(val => parseFloat(val));
        if (values.length != this.count) return;
        console.log(`${this.name}: ${firstLine}`);
        this.history.push(values);
        for (let i = 0; i < this.status.length; i++) {
            const currentStatus = this.status[i]!;
            if (currentStatus === MachineStatus.BROKEN) continue;
            const historyValues = [];
            const shortValues = [];
            for (let j = Math.max(0, Math.floor(this.history.length - HISTORY_TIME / DELAY)); j < this.history.length; j++) {
                const value = this.history[j]![i];
                if (value !== undefined && value != NaN && value <= LUDICROUS_CURRENT)
                    historyValues.push(value);
            }
            for (let j = Math.max(0, Math.floor(this.history.length - SHORT_TIME / DELAY)); j < this.history.length; j++) {
                const value = this.history[j]![i];
                if (value !== undefined && value != NaN && value <= LUDICROUS_CURRENT)
                    shortValues.push(value);
            }
            if (historyValues.length == 0 || shortValues.length == 0) {
                this.changeStatus(i, MachineStatus.NOIDEA);
                continue;
            }
            const historyAverage = historyValues.reduce((a, b) => a + b, 0) / historyValues.length;
            const shortAverage = shortValues.reduce((a, b) => a + b, 0) / shortValues.length;
            console.log(`${this.name}[${i}]: ${Math.floor(shortAverage * 100)} and ${Math.floor(historyAverage * 100)}`);
            if (currentStatus === MachineStatus.NOIDEA) {
                if (shortAverage >= ON_THRESHOLD && shortValues.length * DELAY >= SIGNFIFICANT_RATIO * SHORT_TIME) {
                    this.changeStatus(i, MachineStatus.ON);
                } else if (historyAverage <= OFF_THRESHOLD && historyValues.length * DELAY >= SIGNFIFICANT_RATIO * HISTORY_TIME) {
                    this.changeStatus(i, MachineStatus.OFF);
                }
            } else if (currentStatus === MachineStatus.OFF) {
                if (shortAverage >= ON_THRESHOLD && shortValues.length * DELAY >= SIGNFIFICANT_RATIO * SHORT_TIME) {
                    this.changeStatus(i, MachineStatus.ON);
                }
            } else if (currentStatus === MachineStatus.ON) {
                if (shortAverage <= OFF_THRESHOLD && historyAverage <= OFF_THRESHOLD && historyValues.length * DELAY >= SIGNFIFICANT_RATIO * HISTORY_TIME) {
                    this.changeStatus(i, MachineStatus.OFF);
                }
            }
        }
    }

    private changeStatus(index: number, newStatus: MachineStatus): void {
        this.status[index] = newStatus;
    }
}