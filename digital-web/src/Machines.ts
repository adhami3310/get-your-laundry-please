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
    ON, OFF, BROKEN, NOIDEA, NONE
};

function machineStatusToString(status: MachineStatus): string {
    if (status === MachineStatus.ON) return "ON";
    if (status === MachineStatus.OFF) return "OFF";
    if (status === MachineStatus.BROKEN) return "BROKEN";
    return "UNKNOWN";
}

export class Machines {
    private readonly serialPort: SerialPort;
    private buffer: string = "";
    private readonly status: Array<MachineStatus>;
    private readonly history: Array<Array<number>> = [];
    private readonly lastTransition: Array<number> = [];
    private readonly forcedStates: Array<MachineStatus> = [];
    private readonly mapping: Array<number>;

    public constructor(public readonly name: string, public readonly count: number, path: string, br: number, forcedStates: Array<MachineStatus>, mapping: Array<number>) {
        this.status = Array(count).fill(MachineStatus.NOIDEA);
        this.lastTransition = Array(count).fill(Date.now());
        forcedStates.forEach((state, i) => {
            if (state !== MachineStatus.NONE) {
                this.status[i] = state;
            }
        });
        this.mapping = [...mapping];
        this.serialPort = new SerialPort({ path: path, baudRate: br });
        let parser = this.serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));
        this.serialPort.on("open", () => {
            console.log("opened");
        });
        this.forcedStates = [...forcedStates];
        let self = this;
        parser.on("data", data => {
            self.onData(data);
        });
    }

    public getStatus(): Array<MachineStatus> {
        return this.status.map((_, i) => this.status[this.mapping[i]!]!);
    }

    public getStatusString(): string {
        return this.getStatus().map(status => machineStatusToString(status)).join(" ");
    }

    public getLastTransition(): Array<number> {
        return this.lastTransition.map((_, i) => this.lastTransition[this.mapping[i]!]!);
    }

    public sinceTransition(): Array<number> {
        const timeNow = Date.now();
        return this.getLastTransition().map(value => Math.floor((timeNow - value) / 1000));
    }

    public toJSON(): Object {
        return {
            count: this.count,
            name: this.name,
            path: this.serialPort.path,
            baudRate: this.serialPort.baudRate,
            status: this.getStatus().map(status => machineStatusToString(status)),
            buffer: this.buffer,
            sinceTransition: this.sinceTransition(),
            lastTransition: this.getLastTransition()
        }
    }

    public toString(): string {
        return `${this.name}: ${this.getStatus()}`;
    }

    private onData(data: string): void {
        const receivedTime = Date.now();
        for(const line of data.split("\n")){
            const values = line.split(" ").filter(value => value.length !== 0).map(val => parseFloat(val));
            if(values.length === 0) continue;
            console.log(`${this.name}: [${values.join(", ")}]`);
            assert.strictEqual(values.length, this.count, "Expected number of values to match number of machines, check wiring.");
            this.history.push(values);
            this.updateStatus();
        }
    }

    private updateStatus(): void {
        for (let i = 0; i < this.status.length; i++) {
            const currentStatus = this.status[i]!;
            if (currentStatus === MachineStatus.BROKEN || this.forcedStates[i] != MachineStatus.NONE) continue;
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
        this.lastTransition[index] = Date.now();
    }
}