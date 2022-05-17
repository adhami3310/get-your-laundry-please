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

app.use('/notify/:email/:machine/:spec/:index', (request, response) => {
    const { email, machine, spec, index } = request.params;
    if (machine !== "washer" && machine !== "dryer") {
        response.status(HttpStatus.BAD_REQUEST).type('text').send('expected dryer/washer');
        return;
    }
    const relevantMachine = (machine === "washer" ? washers : dryers);
    if (spec === "any") {
        relevantMachine.addWaiting({ email: email, waiting: "any" });
        response.status(HttpStatus.ACCEPTED);
    } else if (spec === "specific") {
        relevantMachine.addWaiting({ email: email, waiting: "specific", machine: Number.parseInt(index) });
        response.status(HttpStatus.ACCEPTED);
    } else {
        response.status(HttpStatus.BAD_REQUEST);
    }
});

app.listen(80, () => {
    console.log("listening");
});


export async function sendNotification(options: { to: string, subject: string }): Promise<void> {
    transporter.sendMail({
        from: '"Ben Bitdiddle" <random-computer-chair@mit.edu>',
        to: options.to,
        subject: `${options.subject} is ready eom`
    });
}