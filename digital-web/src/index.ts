import assert from 'assert';
import express, { Application, request, response } from 'express';
import { Server } from 'http';
import HttpStatus from 'http-status-codes';
import { Machines, MachineStatus } from './Machines';
import path from 'path';
import { dryersMapping, forcedDryers, forcedWashers, washersMapping } from './ForcedStates';
import nodemailer from 'nodemailer';
import Mail from "nodemailer/lib/mailer";
import { Person } from './Machines';
import * as dotenv from 'dotenv';
dotenv.config({ path: __dirname+'/../.env' });

console.log(process.env);

const app = express();
const washers = new Machines('washer', 3, '/dev/ttyUSB1', 9600, forcedWashers, washersMapping);
const dryers = new Machines('dryer', 4, '/dev/ttyUSB0', 9600, forcedDryers, dryersMapping);
const transporter = nodemailer.createTransport({
    host: "outgoing.mit.edu",
    port: 465,
    secure: true,
    auth: {
        user: process.env["USERNAME"],
        pass: process.env["PASSWORD"],
    },
    logger: true
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((request, response, next) => {
    // allow requests from web pages hosted anywhere
    response.set('Access-Control-Allow-Origin', '*');
    next();
});

app.use('/dist/LaundryElement.js', (request, response) => {
    response.sendFile(path.join(__dirname, '../dist/LaundryElement.js'));
});

app.use('/dist/LaundryElement.js.map', (request, response) => {
    response.sendFile(path.join(__dirname, '../dist/LaundryElement.js.map'));
});

app.use('/watch', (request, response) => {
    response.status(HttpStatus.ACCEPTED).type("json").send({ "washers": washers.toJSON(), "dryers": dryers.toJSON() });
    // response.status(HttpStatus.ACCEPTED).type("text").send(`${washers.toString()}\n${dryers.toString()}\n`);
});

app.post('/notify', (request, response) => {
    const { email, machines } = request.body;
    const machinesArray: Array<{machine: string, index: number}> = Array.from(machines);
    console.log(machinesArray);
    assert(email !== undefined );
    console.log(email);

    machinesArray.forEach(req => {
        const {machine, index} = req;
        if (machine !== "washer" && machine !== "dryer") {
            response.status(HttpStatus.BAD_REQUEST).type('text').send('expected dryer/washer');
            return;
        }
        const relevantMachine = (machine === "washer" ? washers : dryers);
        if (index < 0 || index >= relevantMachine.count) {
            response.status(HttpStatus.BAD_REQUEST).type('text').send('wrong index');
        }
    });
    const washersRequests: Array<number> = [];
    const dryersRequests: Array<number> = [];
    machinesArray.forEach(req => {
        const {machine, index} = req;
        if (machine === "washer") {
            washersRequests.push(index);
        } else {
            dryersRequests.push(index);
        }
    });
    if (washersRequests.length > 0) {
        washers.addWaiting({email: email, machines: washersRequests});
    }
    if (dryersRequests.length > 0) {
        dryers.addWaiting({email: email, machines: dryersRequests});
    }
    response.status(HttpStatus.OK).type('text').send('works just fine');
});

app.get('/', (request, response) => {
    response.sendFile(path.join(__dirname, '../public/index.html'));
});


app.listen(80, () => {
    console.log("listening");
});


export async function sendNotification(options: { to: string, subject: string }): Promise<void> {
    console.log(`sending email to ${options.to}, with content "${options.subject}"`);
    transporter.sendMail({
        sender: "laundry@mit.edu",
        to: options.to,
        subject: options.subject
    });
}

transporter.sendMail({
    sender: "laundry@mit.edu",
    to: "adhami@mit.edu",
    subject: "laundry server is up eom"
})