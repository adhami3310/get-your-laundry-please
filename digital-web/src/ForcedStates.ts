import { MachineStatus } from "./Machines";

export const forcedDryers = [MachineStatus.BROKEN, MachineStatus.NONE, MachineStatus.BROKEN, MachineStatus.BROKEN];
export const dryersMapping = [2, 3, 1, 0];
export const dryersDelay = [0, 0, 0, 0];

export const forcedWashers = [MachineStatus.NONE, MachineStatus.NONE, MachineStatus.NONE];
export const washersMapping = [0, 1, 2];
export const washersDelay = [0, 1000*60*5, 0];