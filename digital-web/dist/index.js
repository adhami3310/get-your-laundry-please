"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = void 0;
const assert_1 = __importDefault(require("assert"));
const express_1 = __importDefault(require("express"));
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const Machines_1 = require("./Machines");
const path_1 = __importDefault(require("path"));
const ForcedStates_1 = require("./ForcedStates");
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: __dirname + '/../.env' });
const app = (0, express_1.default)();
const washers = new Machines_1.Machines('washer', 3, '/dev/ttyUSB1', 9600, ForcedStates_1.forcedWashers, ForcedStates_1.washersMapping);
const dryers = new Machines_1.Machines('dryer', 4, '/dev/ttyUSB0', 9600, ForcedStates_1.forcedDryers, ForcedStates_1.dryersMapping);
const transporter = nodemailer_1.default.createTransport({
    host: "outgoing.mit.edu",
    port: 465,
    secure: true,
    auth: {
        user: process.env["USERNAME"],
        pass: process.env["PASSWORD"],
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
app.get('/.well-known/acme-challenge/:filename', function (req, res) {
    const { filename } = req.params;
    res.sendFile(path_1.default.join(__dirname, '../.well-known/acme-challenge/' + filename));
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
app.post('/notify', (request, response) => {
    const { email, machines } = request.body;
    const machinesArray = Array.from(machines);
    console.log(machinesArray);
    (0, assert_1.default)(email !== undefined);
    console.log(email);
    machinesArray.forEach(req => {
        const { machine, index } = req;
        if (machine !== "washer" && machine !== "dryer") {
            response.status(http_status_codes_1.default.BAD_REQUEST).type('text').send('expected dryer/washer');
            return;
        }
        const relevantMachine = (machine === "washer" ? washers : dryers);
        if (index < 0 || index >= relevantMachine.count) {
            response.status(http_status_codes_1.default.BAD_REQUEST).type('text').send('wrong index');
        }
    });
    const washersRequests = [];
    const dryersRequests = [];
    machinesArray.forEach(req => {
        const { machine, index } = req;
        if (machine === "washer") {
            washersRequests.push(index);
        }
        else {
            dryersRequests.push(index);
        }
    });
    if (washersRequests.length > 0) {
        washers.addWaiting({ email: email, machines: washersRequests });
    }
    if (dryersRequests.length > 0) {
        dryers.addWaiting({ email: email, machines: dryersRequests });
    }
    response.status(http_status_codes_1.default.OK).type('text').send('works just fine');
});
app.get('/', (request, response) => {
    response.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
app.listen(80, () => {
    console.log('Listening...');
});
https_1.default.createServer({
    key: fs_1.default.readFileSync(process.env["KEY"]),
    cert: fs_1.default.readFileSync(process.env["CERT"]),
    ca: fs_1.default.readFileSync(process.env["CA"])
}, app).listen(443, () => {
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