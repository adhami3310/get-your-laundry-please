import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import assert from 'assert';
import { sendNotification } from '.';

const HISTORY_TIME = 60000; //number of milliseconds to use to change data from ON to OFF
const SHORT_TIME = 30000; //number of milliseconds to use to change data from OFF to ON
const LUDICROUS_CURRENT = 40; // above this the machine is acting weird and prob sth happened wrong
const ON_THRESHOLD = 1; //the threshold to become ON
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

export type Person = {
    email: string,
    waiting: "any" | "specific",
    machine?: number
}

export class Machines {
    private readonly serialPort: SerialPort;
    private readonly status: Array<MachineStatus>;
    private history: Array<Record> = [];
    private readonly lastTransition: Array<number> = [];
    private readonly forcedStates: Array<MachineStatus> = [];
    private readonly mapping: Array<number>;
    private waiting: Array<Person> = [];

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
            lastTransition: this.getLastTransition()
        }
    }

    public toString(): string {
        return `${this.name}: ${this.getStatus()}`;
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
        this.history = this.history.filter(record => (currentTime - record.time <= HISTORY_TIME));
        for (let i = 0; i < this.status.length; i++) {
            const currentStatus = this.status[i]!;
            if (currentStatus === MachineStatus.BROKEN || this.forcedStates[i] != MachineStatus.NONE) continue;
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
                } else if (historyAverage <= OFF_THRESHOLD) {
                    this.changeStatus(i, MachineStatus.OFF);
                }
            } else if (currentStatus === MachineStatus.OFF) {
                if (shortAverage >= ON_THRESHOLD) {
                    this.changeStatus(i, MachineStatus.ON);
                }
            } else if (currentStatus === MachineStatus.ON) {
                if (shortAverage <= OFF_THRESHOLD && historyAverage <= OFF_THRESHOLD) {
                    this.changeStatus(i, MachineStatus.OFF);
                }
            }
            console.log(`${this.name}[${i}]: ${Math.floor(shortAverage * 100)}, ${Math.floor(historyAverage * 100)}, ${Math.floor(shortValues[shortValues.length-1]! * 100)}`);
        }
    }

    public addWaiting(person: Person): void {
        if (person.waiting === "specific") {
            if (this.waiting.filter(otherPerson => otherPerson.email === person.email)
                .filter(otherPerson => otherPerson.waiting === "any" || otherPerson.machine === person.machine)
                .length > 0) return;
            this.waiting.push({ email: person.email, waiting: "specific", machine: person.machine });
        } else {
            this.waiting = this.waiting.filter(otherPerson => otherPerson.email !== person.email);
            this.waiting.push({ email: person.email, waiting: "any" });
        }
    }

    private changeStatus(index: number, newStatus: MachineStatus): void {
        const outsideIndex = this.mapping.indexOf(index);
        if (newStatus === MachineStatus.OFF) {
            const people = this.waiting.filter(person => person.waiting === "any" || person.machine === outsideIndex);
            this.waiting = this.waiting.filter(person => person.waiting === "specific" && person.machine !== outsideIndex);
            people.forEach(person => {
                if (person.waiting === "any") sendNotification({ to: person.email, subject: `a ${this.name}` });
                else sendNotification({ to: person.email, subject: `${this.name} #${outsideIndex}` });
            });
        }
        this.status[index] = newStatus;
        this.lastTransition[index] = Date.now();
    }
}