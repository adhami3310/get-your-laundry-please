"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const Machines_1 = require("./Machines");
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const washers = new Machines_1.Machines('Washers', 3, '/dev/ttyUSB1', 9600);
const dryers = new Machines_1.Machines('Dryers', 4, '/dev/ttyUSB0', 9600);
app.use('/dist/LaundryElement.js', (request, response) => {
    response.sendFile(path_1.default.join(__dirname, '../dist/LaundryElement.js'));
});
app.use('/watch', (request, response) => {
    response.status(http_status_codes_1.default.ACCEPTED).type("json").send({ "washers": washers.toJSON(), "dryers": dryers.toJSON() });
    // response.status(HttpStatus.ACCEPTED).type("text").send(`${washers.toString()}\n${dryers.toString()}\n`);
});
app.use('/', (request, response) => {
    response.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
app.listen(80, () => {
    console.log("listening");
});
//# sourceMappingURL=index.js.map