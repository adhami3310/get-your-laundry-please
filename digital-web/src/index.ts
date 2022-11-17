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
    console.log(request.body);
    // const { email, machines } = request.body;
    // assert(email !== undefined && machines !== undefined);
    // machines.forEach(req: {machine: String, index: String } => {
    //     const {machine, index} = req;
    //     if (machine !== "washer" && machine !== "dryer") {
    //         response.status(HttpStatus.BAD_REQUEST).type('text').send('expected dryer/washer');
    //         return;
    //     }
    //     const relevantMachine = (machine === "washer" ? washers : dryers);
    //     const machineIndex = Number.parseInt(index);
    //     if (machineIndex < 0 || machineIndex >= relevantMachine.count) {
    //         response.status(HttpStatus.BAD_REQUEST).type('text').send('wrong index');
    //     }
    // });
    // const washersRequests: Array<Number> = [];
    // const dryersRequests: Array<number> = [];
    // machines.forEach(machine => {
    //     const machineIndex = Number.parseInt(index);
    //     if (machine === "washer") {
    //         washersRequests.push(machineIndex);
    //     } else {
    //         dryersRequests.push(machineIndex);
    //     }
    // });
    // if (washersRequests.length > 0) {
    //     washers.addWaiting({email: email, machiens: washersRequests});
    // }
    // if (dryersRequests.length > 0) {
    //     dryers.addWaiting({email: email, machiens: dryersRequests});
    // }
    // relevantMachine.addWaiting({ email: email, machine: Number.parseInt(index) });
    // response.status(HttpStatus.ACCEPTED).type('text').send('works just fine');
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