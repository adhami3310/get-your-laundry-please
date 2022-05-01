import assert from 'assert';
import express, { Application } from 'express';
import { Server } from 'http';
import HttpStatus from 'http-status-codes';
import { Machines } from './Machines';
import path from 'path';

const app = express();
const washers = new Machines('Washers', 3, '/dev/ttyUSB1', 9600);
const dryers = new Machines('Dryers', 4, '/dev/ttyUSB0', 9600);

app.use('/', (requestion, response) => {
    response.sendFile(path.join(__dirname, '/index.html'));
});

app.use('/watch', (request, response) => {
    response.status(HttpStatus.ACCEPTED).type("json").send({ "washers": washers.toJSON(), "dryers": dryers.toJSON() });
    // response.status(HttpStatus.ACCEPTED).type("text").send(`${washers.toString()}\n${dryers.toString()}\n`);
});

app.listen(80, () => {
    console.log("listening");
});