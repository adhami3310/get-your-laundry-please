import assert from 'assert';
import express, { Application } from 'express';
import { Server } from 'http';
import HttpStatus from 'http-status-codes';
import { Machines } from './Machines';


const app = express();
const washers = new Machines('Washers', 3, '/dev/ttyUSB1', 9600);
const dryers = new Machines('Dryers', 4, '/dev/ttyUSB0', 9600);

app.use(express.static(__dirname+'/public'));

app.use('/watch', (request, response) => {
    response.status(HttpStatus.ACCEPTED).type("json").send({ "washers": washers.toJSON(), "dryers": dryers.toJSON() });
    // response.status(HttpStatus.ACCEPTED).type("text").send(`${washers.toString()}\n${dryers.toString()}\n`);
});

app.listen(80, () => {
    console.log("listening");
});