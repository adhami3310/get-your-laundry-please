import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import assert from 'assert';

export enum MachineStatus {
    ON, OFF, BROKEN
};

export class Machines {
    private readonly serialPort: SerialPort;
    private buffer: string = "";
    private readonly status: Array<MachineStatus>;

    public constructor(count: number, path: string, br: number) {
        this.serialPort = new SerialPort({ path: path, baudRate: br });
        this.status = Array(count).fill(MachineStatus.OFF);
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

    public toString(): string {
        return this.status.map((status)=>{
            if(status === MachineStatus.ON) return "ON";
            if(status === MachineStatus.OFF) return "OFF";
            return "BROKEN";
        }).join(" ");
    }

    private onData(data: any): void {
        this.buffer += data + "\n";
        const lines = this.buffer.split("\n");
        if (lines.length === 1) return; //return until a full line has been received
        const firstLine = lines[0];
        assert(firstLine !== undefined);
        this.buffer = lines.slice(1).join("\n");
        console.log("what does the machine say?", firstLine);
        const values = firstLine.split(" ").map(val => parseFloat(val));
    }
}