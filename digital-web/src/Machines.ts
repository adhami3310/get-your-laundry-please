import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { sendNotification } from '.';

const OFF_DURATION = 90000; //number of milliseconds to use to change data from ON to OFF
const ON_DURATION = 20000; //number of milliseconds to use to change data from OFF to ON
const LUDICROUS_CURRENT = 40; // above this the machine is acting weird and prob sth happened wrong
const ON_THRESHOLD = 0.9; //the threshold to become ON
const OFF_THRESHOLD = 0.7; //the threshold to become OFF

export enum MachineStatus {
    ON, OFF, BROKEN, NOIDEA, NONE
};

type Record = {
    values: Array<number>,
    time: number
}

function machineStatusToString(status: MachineStatus): string {
    if (status === MachineStatus.ON) return "ON";
    if (status === MachineStatus.OFF) return "OFF";
    if (status === MachineStatus.BROKEN) return "BROKEN";
    return "UNKNOWN";
}

function averageOfMax(values: Array<number>, count: number): number {
    const sortedValues = [...values].sort((a, b) => b - a);
    const topValues = sortedValues.filter((elt, i) => i < count);
    const topSum = topValues.reduce((a, b) => a + b, 0);
    return topSum / count;
}

export type Person = {
    email: string,
    machines: Array<number>
}

export class Machines {
    private readonly serialPort: SerialPort;
    private readonly status: Array<MachineStatus>;
    private history: Array<Record> = [];
    private readonly lastTransition: Array<number> = [];
    private readonly forcedStates: Array<MachineStatus> = [];
    private readonly machineDelay: Array<number> = [];
    private readonly mapping: Array<number>;
    private waiting: Array<Person> = [];

    public constructor(
        public readonly name: string,
        public readonly count: number,
        path: string,
        br: number,
        forcedStates: Array<MachineStatus>,
        mapping: Array<number>,
        machineDelay: Array<number>
    ) {
        this.status = Array(count).fill(MachineStatus.NOIDEA);
        this.lastTransition = Array(count).fill(Date.now());
        forcedStates.forEach((state, i) => {
            if (state !== MachineStatus.NONE) {
                this.status[i] = state;
            }
        });
        this.mapping = [...mapping];
        this.machineDelay = [...machineDelay];
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
        return this.getLastTransition().map(value => Math.floor(timeNow - value));
    }

    public toJSON(): Object {
        return {
            count: this.count,
            name: this.name,
            path: this.serialPort.path,
            baudRate: this.serialPort.baudRate,
            status: this.getStatus().map(status => machineStatusToString(status)),
            sinceTransition: this.sinceTransition(),
            lastTransition: this.getLastTransition(),
            values: this.values()
        }
    }

    private values(): Array<{last: number | undefined, short: number | undefined, long: number | undefined}> {
        return this.status.map((elt, i) => {
            const maxes = this.maxes(this.mapping[i]!);
            return {last: maxes.last, short: maxes.shortMax, long: maxes.longMax};
        });
    }

    public toString(): string {
        return `${this.name}: ${this.getStatus()}`;
    }

    private maxes(i: number): {shortMax: number | undefined , longMax: number | undefined, last: number | undefined} {
        const currentTime = Date.now();
        const longValues = this.history
            .filter(record => currentTime - record.time <= OFF_DURATION + this.machineDelay[i]!)
            .map(record => record.values[i])
            .map(value => value !== undefined ? value : NaN)
            .filter(value => !Number.isNaN(value) && value <= LUDICROUS_CURRENT);
        const shortValues = this.history
            .filter(record => currentTime - record.time <= ON_DURATION)
            .map(record => record.values[i])
            .map(value => value !== undefined ? value : NaN)
            .filter(value => !Number.isNaN(value) && value <= LUDICROUS_CURRENT);
        if (longValues.length == 0 || shortValues.length == 0) {
            return {shortMax: undefined, longMax: undefined, last: undefined};
        }
        const longMax = averageOfMax(longValues, 3);
        const shortMax = averageOfMax(shortValues, 2);
        const last = shortValues[shortValues.length-1]!;
        return {shortMax, longMax, last};
    }

    private onData(data: string): void {
        const receivedTime = Date.now();
        for (const line of data.split("\n")) {
            const values = line.split(" ").map(val => parseFloat(val)).filter(value => !Number.isNaN(value));
            if (values.length === 0) continue;
            //console.log(`${this.name}: [${values.join(", ")}]`);
            if (values.length !== this.count) {
                console.log("Expected number of values to match number of machines, check wiring.");
                return;
            }
            this.history.push({ values: values, time: receivedTime });
            this.updateStatus();
        }
    }

    private updateStatus(): void {
        const currentTime = Date.now();
        const maxDelay = this.machineDelay.reduce((a, b) => Math.max(a, b), 0);
        this.history = this.history.filter(record => (currentTime - record.time <= OFF_DURATION + maxDelay));
        for (let i = 0; i < this.status.length; i++) {
            const currentStatus = this.status[i]!;
            if (currentStatus === MachineStatus.BROKEN || this.forcedStates[i] != MachineStatus.NONE) continue;
            const {shortMax, longMax, last} = this.maxes(i);
            if (shortMax === undefined || longMax === undefined || last === undefined) {
                this.changeStatus(i, MachineStatus.NOIDEA);
                continue;
            }
            if (currentStatus === MachineStatus.NOIDEA) {
                if (shortMax >= ON_THRESHOLD) {
                    console.log(`${this.name}[${i}]: ${Math.floor(shortMax * 100)}, ${Math.floor(longMax * 100)}, ${Math.floor(last * 100)}, ${machineStatusToString(this.status[i]!)} => ON`);
                    this.changeStatus(i, MachineStatus.ON);
                } else if (longMax <= OFF_THRESHOLD) {
                    console.log(`${this.name}[${i}]: ${Math.floor(shortMax * 100)}, ${Math.floor(longMax * 100)}, ${Math.floor(last * 100)}, ${machineStatusToString(this.status[i]!)} => OFF`);
                    this.changeStatus(i, MachineStatus.OFF);
                }
            } else if (currentStatus === MachineStatus.OFF) {
                if (shortMax >= ON_THRESHOLD) {
                    console.log(`${this.name}[${i}]: ${Math.floor(shortMax * 100)}, ${Math.floor(longMax * 100)}, ${Math.floor(last * 100)}, ${machineStatusToString(this.status[i]!)} => ON`);
                    this.changeStatus(i, MachineStatus.ON);
                }
            } else if (currentStatus === MachineStatus.ON) {
                if (shortMax <= OFF_THRESHOLD && longMax <= OFF_THRESHOLD) {
                    console.log(`${this.name}[${i}]: ${Math.floor(shortMax * 100)}, ${Math.floor(longMax * 100)}, ${Math.floor(last * 100)}, ${machineStatusToString(this.status[i]!)} => OFF`);
                    this.changeStatus(i, MachineStatus.OFF);
                }
            }
        }
    }

    public addWaiting(person: Person): void {
        this.waiting.push({ email: person.email, machines: person.machines });
    }

    private changeStatus(index: number, newStatus: MachineStatus): void {
        const outsideIndex = this.mapping.indexOf(index);
        if (newStatus === MachineStatus.OFF) {
            console.log(this.waiting);
            const people = this.waiting.filter(person => person.machines.find((x) => x === outsideIndex) != undefined);
            this.waiting = this.waiting.filter(person => person.machines.find((x) => x === outsideIndex) === undefined);
            people.forEach(person => {
                sendNotification({ to: person.email, subject: `${this.name} #${outsideIndex + 1} is ready eom` });
            });
        }
        this.status[index] = newStatus;
        this.lastTransition[index] = Date.now();
    }
}