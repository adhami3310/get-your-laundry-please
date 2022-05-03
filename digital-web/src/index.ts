import assert from 'assert';
import express, { Application, request } from 'express';
import { Server } from 'http';
import HttpStatus from 'http-status-codes';
import { Machines, MachineStatus } from './Machines';
import path from 'path';
import { dryersMapping, forcedDryers, forcedWashers, washersMapping } from './ForcedStates';

const app = express();
const washers = new Machines('Washers', 3, '/dev/ttyUSB1', 9600, forcedWashers,washersMapping);
const dryers = new Machines('Dryers', 4, '/dev/ttyUSB0', 9600, forcedDryers, dryersMapping);

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


app.listen(80, () => {
    console.log("listening");
});