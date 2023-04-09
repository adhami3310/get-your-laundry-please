"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.washersDelay = exports.washersMapping = exports.forcedWashers = exports.dryersDelay = exports.dryersMapping = exports.forcedDryers = void 0;
const Machines_1 = require("./Machines");
exports.forcedDryers = [Machines_1.MachineStatus.NONE, Machines_1.MachineStatus.NONE, Machines_1.MachineStatus.BROKEN, Machines_1.MachineStatus.NONE];
exports.dryersMapping = [2, 3, 1, 0];
exports.dryersDelay = [0, 0, 0, 0];
exports.forcedWashers = [Machines_1.MachineStatus.NONE, Machines_1.MachineStatus.NONE, Machines_1.MachineStatus.BROKEN];
exports.washersMapping = [0, 1, 2];
exports.washersDelay = [0, 1000 * 60 * 5, 0];
//# sourceMappingURL=ForcedStates.js.map