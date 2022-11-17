"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = void 0;
const assert_1 = __importDefault(require("assert"));
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const Machines_1 = require("./Machines");
const path_1 = __importDefault(require("path"));
const ForcedStates_1 = require("./ForcedStates");
const nodemailer_1 = __importDefault(require("nodemailer"));
const app = (0, express_1.default)();
const washers = new Machines_1.Machines('washer', 3, '/dev/ttyUSB1', 9600, ForcedStates_1.forcedWashers, ForcedStates_1.washersMapping);
const dryers = new Machines_1.Machines('dryer', 4, '/dev/ttyUSB0', 9600, ForcedStates_1.forcedDryers, ForcedStates_1.dryersMapping);
const transporter = nodemailer_1.default.createTransport({
    host: "outgoing.mit.edu",
    port: 465,
    secure: true,
    auth: {
        user: "adhami",
        pass: "",
    },
    logger: true
});
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((request, response, next) => {
    // allow requests from web pages hosted anywhere
    response.set('Access-Control-Allow-Origin', '*');
    next();
});
app.use('/dist/LaundryElement.js', (request, response) => {
    response.sendFile(path_1.default.join(__dirname, '../dist/LaundryElement.js'));
});
app.use('/dist/LaundryElement.js.map', (request, response) => {
    response.sendFile(path_1.default.join(__dirname, '../dist/LaundryElement.js.map'));
});
app.use('/watch', (request, response) => {
    response.status(http_status_codes_1.default.ACCEPTED).type("json").send({ "washers": washers.toJSON(), "dryers": dryers.toJSON() });
    // response.status(HttpStatus.ACCEPTED).type("text").send(`${washers.toString()}\n${dryers.toString()}\n`);
});
app.use('/', (request, response) => {
    response.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
app.post('/notify', (request, response) => {
    console.log(request.body);
    const { email, machine, index } = request.body;
    (0, assert_1.default)(email && machine && index);
    if (machine !== "washer" && machine !== "dryer") {
        response.status(http_status_codes_1.default.BAD_REQUEST).type('text').send('expected dryer/washer');
        return;
    }
    const relevantMachine = (machine === "washer" ? washers : dryers);
    const machineIndex = Number.parseInt(index);
    if (machineIndex < 0 || machineIndex >= relevantMachine.count) {
        response.status(http_status_codes_1.default.BAD_REQUEST).type('text').send('wrong index');
    }
    relevantMachine.addWaiting({ email: email, machine: Number.parseInt(index) });
    response.status(http_status_codes_1.default.ACCEPTED).type('text').send('works just fine');
});
app.listen(80, () => {
    console.log("listening");
});
async function sendNotification(options) {
    console.log(`sending email to ${options.to}, with content "${options.subject}"`);
    transporter.sendMail({
        sender: "laundry@mit.edu",
        to: options.to,
        subject: options.subject
    });
}
exports.sendNotification = sendNotification;
transporter.sendMail({
    sender: "laundry@mit.edu",
    to: "adhami@mit.edu",
    subject: "laundry server is up eom"
});
//# sourceMappingURL=index.js.map