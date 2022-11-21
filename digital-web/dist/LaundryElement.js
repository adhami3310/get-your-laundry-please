"use strict";
const states = new Set(["OFF", "ON", "UNKNOWN", "BROKEN"]);
const subStates = new Set(["ON", "UNKNOWN", "BROKEN", "OFF"]);
const styles = `
@import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200");

.material-symbols-outlined {
    font-variation-settings:
        'FILL' 1,
        'wght' 400,
        'GRAD' 0,
        'opsz' 48;
    font-size: 1.5em;
}

:host {
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    display: inline-block;
    color: white;
}

:where(.on,.unknown,.broken,.off).laundry-machine {
    cursor: pointer;
}

:where(.on,.unknown,.broken,.off).laundry-machine:hover {
    outline: 5px solid #EE6485;
}

:where(.on,.unknown,.broken,.off).laundry-machine:active {
    outline: 5px solid red;
}

:where(.on,.unknown,.broken,.off).laundry-machine.active {
    outline: 5px solid red;
}

.laundry-machine {
    height: 15em;
    border-radius: 0.5em;
    background: var(--secondary);
    border: 2px solid var(--secondary);
    overflow: hidden;
}

.unknown .laundry-body {
    filter: grayscale(1);
}

.broken .laundry-body {
    filter: grayscale(1) brightness(0.4);
}

.laundry-body {
    border-radius: 0.5em;
    width: 12em;
    --vibrate-speed: 400ms;
    --vibrate-distance: 0.1em;
}

.on .laundry-body {
    animation: bouncing infinite var(--vibrate-speed) linear;
}

.controls {
    background: var(--secondary);
    align-items: center;
    gap: 0.5em;
    height: 3em;
    display: flex;
}

.knob {
    border-radius: 100%;
    background: var(--on-primary);
    height: 1.4em;
    width: 1.4em;
}

@media (prefers-color-scheme: dark) {
    .broken .knob {
        background: black;
    }

    .on .knob {
        background: var(--on-error-dark);
    }
    
    .on .screen {
        border-color: var(--on-error-dark);
        background: var(--error-dark);
    }
    
    .off .screen {
        background: #4BB543;
    }
}


.screen {
    border: var(--on-primary) solid 0.2em;
    background: grey;
    height: 1.2em;
    width: 2.2em;
}

.drawer {
    height: 3em;
    width: 4em;
    display: flex;
    border-right: 0.15em solid grey;
    justify-content: center;
    align-items: flex-end;
    margin-right: 0.3em;
}

.handle {
    height: 0.3em;
    background: grey;
    border-top-left-radius: 0.5em;
    border-top-right-radius: 0.5em;
    width: 2em;
}

@keyframes bouncing {
    from {
        transform: scale(1, 1) translate(0, 0);
    }
    25% {
        transform: scale(1, 1.03) translate(0, -1.5%);
    }
    50% {
        transform: scale(1, 1) translate(0, 0);
    }
    75% {
        transform: scale(1.03, 1) translate(0, 0);
    }
    to {
        transform: scale(1, 1) translate(0, 0);
    }
}

@keyframes vibrate {
    from {
        transform: translate(0, 0);
    }
    10% {
        transform: translate(calc(-1 * var(--vibrate-distance)), calc(var(--vibrate-distance)));
    }
    25% {
        transform: translate(0, 0);
    }
    35% {
        transform: translate(calc(var(--vibrate-distance)), calc(-1 * var(--vibrate-distance)));
    }
    50% {
        transform: translate(0, 0);
    }
    60% {
        transform: translate(calc(-1 * var(--vibrate-distance)), calc(-1 * var(--vibrate-distance)));
    }
    75% {
        transform: translate(0, 0);
    }
    85% {
        transform: translate(calc(var(--vibrate-distance)), calc(var(--vibrate-distance)));
    }
    to {
        transform: translate(0, 0);
    }
}


@keyframes antivibrate {
    from {
        transform: translate(0, 0);
    }
    10% {
        transform: translate(calc(1 * var(--vibrate-distance)), calc(-1 * var(--vibrate-distance)));
    }
    25% {
        transform: translate(0, 0);
    }
    35% {
        transform: translate(calc(-1 * var(--vibrate-distance)), calc(var(--vibrate-distance)));
    }
    50% {
        transform: translate(0, 0);
    }
    60% {
        transform: translate(calc(var(--vibrate-distance)), calc(var(--vibrate-distance)));
    }
    75% {
        transform: translate(0, 0);
    }
    85% {
        transform: translate(calc(-1 * var(--vibrate-distance)), calc(-1 * var(--vibrate-distance)));
    }
    to {
        transform: translate(0, 0);
    }
}

.off .tub {
    background: #4BB543;
}


.on .tub {
    border-color: var(--on-error-dark);
    background: var(--error-dark);
}

.on .text{
    color: var(--on-error-dark);
}

@media (prefers-color-scheme: light) {
    .off .tub {
        border-color: var(--secondary);
    }

    .on .tub {
        border-color: var(--secondary);
        background: var(--error-dark);
    }
    
    .on .text{
        color: var(--on-error-dark);
    }
}

.broken .material-symbols-outlined {
    color: white;
}

.unknown .text{
    color: white;
}

.broken .tub {
    background: black;
    border-color: grey;
}

.unknown .tub {
    background: darkgrey;
}

.broken .since {
    display: none;
}

.unknown .since {
    display: none;
}

.tub {
    border: 0.8em solid var(--on-primary-dark);
    border-radius: 100%;
    height: 9em;
    width: 9em;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.washing {
    background: var(--surface-light);
    height: 12em;
    display: flex;
    justify-content: center;
    align-items: center;
}

#swatch {
    font-size: 3em;
    display: flex;
    flex-direction: column;
    line-height: 1em;
}

.since {
    font-size: 1.5em;
    line-height: 1em;
}

.text {
    position: relative;
    top: -50%;
    transform: translateY(calc(-50% + 1.5em));
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    gap: 0.5em;
}

.on .text {
    animation: antivibrate infinite var(--vibrate-speed) linear;
}

`;
class LaundryElement extends HTMLElement {
    machineState = "UNKNOWN";
    lastTransition = Date.now().toString();
    notifState = false;
    callbacks = [];
    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.innerHTML = `<style>${styles}</style>
        <div class="laundry-machine unknown">
            <div class="laundry-body">
                <div class="controls">
                    <div class="drawer">
                        <div class="handle"></div>
                    </div>
                    <div class="knob"></div>
                    <div class="knob"></div>
                    <div class="screen"></div>
                </div>
                <div class="washing">
                    <div class="tub">
                    </div>
                </div>
            </div>
            <div class="text">
                <div id="swatch"></div>
                <div class="since"></div>
            </div>
        </div>
        `;
        shadowRoot.addEventListener("click", (ev) => {
            if (subStates.has(this.machineState)) {
                this.notifToggle();
            }
        });
    }
    get state() {
        return this.machineState;
    }
    addNotificationToggle(callback) {
        this.callbacks.push(callback);
    }
    turnNotifOff() {
        if (this.notifState) {
            this.notifToggle();
        }
    }
    notifToggle() {
        this.callbacks.forEach(callback => {
            callback(this.notifState);
        });
        this.notifState = !this.notifState;
        this.shadowRoot?.querySelector(".laundry-machine")?.classList.toggle("active");
    }
    set state(v) {
        v = v.toUpperCase();
        if (!states.has(v))
            return;
        if (subStates.has(this.machineState) && !subStates.has(v) && this.notifState)
            this.notifToggle();
        this.machineState = v;
        this.setAttribute("state", v);
    }
    get transition() {
        return this.lastTransition;
    }
    set transition(v) {
        this.lastTransition = v.toString();
        this.setAttribute("transition", v);
    }
    static get observedAttributes() {
        return ["state", "transition"];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "state") {
            newValue = newValue.toUpperCase();
            if (!states.has(newValue))
                return;
            if (subStates.has(this.machineState) && !subStates.has(newValue) && this.notifState)
                this.notifToggle();
            this.machineState = newValue;
            const shadowRoot = this.shadowRoot;
            if (shadowRoot) {
                const machine = shadowRoot.querySelector(".laundry-machine");
                if (machine) {
                    if (oldValue === null) {
                        machine.classList.toggle("UNKNOWN".toLowerCase());
                    }
                    else {
                        machine.classList.toggle(oldValue.toLowerCase());
                    }
                    machine.classList.toggle(newValue.toLowerCase());
                }
            }
        }
        if (name === "transition") {
            this.lastTransition = newValue.toString();
        }
        this.render();
    }
    connectedCallback() {
        this.render();
        let self = this;
        setInterval(() => self.tick(), 2000);
    }
    tick() {
        this.render();
    }
    static getSince(last) {
        return Math.floor((Date.now() - Number.parseInt(last)) / (60 * 1000));
    }
    static timeDisplay(time) {
        if (time < 60)
            return `${time}m`;
        if (time < 60 * 24)
            return `${Math.floor(time / 60)}h`;
        return `${Math.floor(time / (60 * 24))}d`;
    }
    render() {
        const swatch = this.shadowRoot?.querySelector("#swatch");
        const since = this.shadowRoot?.querySelector(".since");
        if (swatch !== undefined && swatch !== null && since !== undefined && since !== null) {
            if (this.state === "OFF") {
                swatch.innerHTML = `FREE`;
                since.innerHTML = `for ${LaundryElement.timeDisplay(LaundryElement.getSince(this.lastTransition))}`;
            }
            else if (this.state === "ON") {
                swatch.innerHTML = `BUSY`;
                since.innerHTML = `for ${LaundryElement.timeDisplay(LaundryElement.getSince(this.lastTransition))}`;
            }
            else if (this.state === "UNKNOWN") {
                swatch.innerHTML = `<span class="material-symbols-outlined">question_mark</span>`;
                since.innerHTML = "";
            }
            else {
                swatch.innerHTML = `<span class="material-symbols-outlined">heart_broken</span>`;
                since.innerHTML = "";
            }
        }
    }
}
customElements.define('laundry-element', LaundryElement);
//# sourceMappingURL=LaundryElement.js.map