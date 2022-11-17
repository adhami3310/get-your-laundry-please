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

const app = express();
const washers = new Machines('washer', 3, '/dev/ttyUSB1', 9600, forcedWashers, washersMapping);
const dryers = new Machines('dryer', 4, '/dev/ttyUSB0', 9600, forcedDryers, dryersMapping);
const transporter = nodemailer.createTransport({
    host: "outgoing.mit.edu",
    port: 465,
    secure: true,
    auth: {
        user: "adhami",
        pass: "",
    },
    logger: true
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

app.use('/', (request, response) => {
    response.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use('/notify/:email/:machine/:index', (request, response) => {
    const { email, machine, index } = request.params;
    if (machine !== "washer" && machine !== "dryer") {
        response.status(HttpStatus.BAD_REQUEST).type('text').send('expected dryer/washer');
        return;
    }
    const relevantMachine = (machine === "washer" ? washers : dryers);
    const machineIndex = Number.parseInt(index);
    if (machineIndex < 0 || machineIndex >= relevantMachine.count) {
        response.status(HttpStatus.BAD_REQUEST).type('text').send('wrong index');
    }
    console.log(`request: ${email}, ${machine}, ${index}`);
    relevantMachine.addWaiting({ email: email, machine: Number.parseInt(index) });
    response.status(HttpStatus.ACCEPTED);
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