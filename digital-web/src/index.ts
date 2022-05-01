import assert from 'assert';
import express, { Application } from 'express';
import { Server } from 'http';
import HttpStatus from 'http-status-codes';
import { Machines } from './Machines';


const app = express();
const washers = new Machines(3, '/dev/ttyUSB1', 9600);
const dryers = new Machines(4, '/dev/ttyUSB0', 9600);

app.use('/', (request, response) => {
    response.status(HttpStatus.ACCEPTED).type("text").send(washers.toString());
});

app.listen(8080, () => {
    console.log("listening");
});