import { MachineStatus } from "./Machines";

export const forcedDryers = [MachineStatus.NONE, MachineStatus.NONE, MachineStatus.NONE, MachineStatus.NONE];
export const dryersMapping = [2, 1, 0, 3];

export const forcedWashers = [MachineStatus.NONE, MachineStatus.NOIDEA, MachineStatus.NONE];
export const washersMapping = [0, 1, 2];