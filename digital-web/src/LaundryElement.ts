const states = new Set(["OFF", "ON", "UNKNOWN", "BROKEN"]);

const styles = `
:host {
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    display: inline-block;
    color: black;
}

.laundry-machine {
    height: 15em;
}

.unknown .laundry-body {
    filter: grayscale(1);
}

.broken .laundry-body {
    filter: brightness(0.2);
}

.laundry-body {
    width: 12em;
    --vibrate-speed: 400ms;
    --vibrate-distance: 0.1em;
}

.on .laundry-body {
    animation: bouncing infinite var(--vibrate-speed) linear;
}

.controls {
    background: #546376;
    border-top-left-radius: 0.5em;
    border-top-right-radius: 0.5em;
    align-items: center;
    gap: 0.5em;
    height: 3em;
    display: flex;
}

.knob {
    border-radius: 100%;
    background: white;
    height: 1.4em;
    width: 1.4em;
}

.screen {
    border: white solid 0.2em;
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
    background: yellowgreen;
}

.on .tub {
    background: #7b0000;
}

.on .text{
    color: white;
}

.broken .text{
    color: white;
    top: -100%;
    margin-top: 64%;
    font-size: 0.8em;
    line-height: 3em;
}

.unknown .text{
    top: -100%;
    margin-top: 62%;
    line-height: 3em;
}

.broken .tub {
    background: black;
}

.unknown .tub {
    background: darkgrey;
}

.tub {
    border: 0.8em solid grey;
    border-radius: 100%;
    height: 9em;
    width: 9em;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.washing {
    background: #eee;
    border-bottom-left-radius: 0.5em;
    border-bottom-right-radius: 0.5em;
    height: 12em;
    display: flex;
    justify-content: center;
    align-items: center;
}

#swatch {
    font-size: 3em;
}

.since {
    font-size: 1.5em;
}

.text {
    position: relative;
    top: -100%;
    margin-top: 50%;
    line-height: 3em;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-weight: bold;
}

.on .text {
    animation: antivibrate infinite var(--vibrate-speed) linear;
}

`;

class LaundryElement extends HTMLElement {
    private machineState: string = "UNKNOWN";
    private lastTransition: string = Date.now().toString();

    public constructor() {
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
    }

    public get state(): string {
        return this.machineState;
    }

    public set state(v: string) {
        v = v.toUpperCase();
        if (!states.has(v)) return;
        this.machineState = v;
        this.setAttribute("state", v);
    }

    public get transition(): string {
        return this.lastTransition;
    }

    public set transition(v: string) {
        this.lastTransition = v.toString();
        this.setAttribute("transition", v);
    }

    public static get observedAttributes(): Array<string> {
        return ["state", "transition"];
    }

    public attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        if (name === "state") {
            newValue = newValue.toUpperCase();
            if (!states.has(newValue)) return;
            this.machineState = newValue;
            const shadowRoot = this.shadowRoot;
            if (shadowRoot) {
                const machine = shadowRoot.querySelector(".laundry-machine");
                if (machine) {
                    if (oldValue === null) {
                        machine.classList.toggle("UNKNOWN".toLowerCase());
                    } else {
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

    public connectedCallback(): void {
        this.render();
        let self = this;
        setInterval(() => self.tick(), 2000);
    }

    private tick(): void {
        this.render();
    }

    private static getSince(last: string): number{
        return Math.floor((Date.now() - Number.parseInt(last)) / (60 * 1000));
    }

    private render(): void {
        const swatch = this.shadowRoot?.querySelector("#swatch");
        const since = this.shadowRoot?.querySelector(".since");
        if (swatch !== undefined && swatch !== null && since !== undefined && since !== null) {
            if (this.state === "OFF") {
                swatch.innerHTML = `FREE`;
                since.innerHTML = `since ${LaundryElement.getSince(this.lastTransition)}m`;
            } else if (this.state === "ON") {
                swatch.innerHTML = `ON`;
                since.innerHTML = `since ${LaundryElement.getSince(this.lastTransition)}m`;
            } else if (this.state === "UNKNOWN") {
                swatch.innerHTML = "?";
                since.innerHTML = "";
            } else {
                swatch.innerHTML = "broken";
                since.innerHTML = "";
            }
        }
    }
}

customElements.define('laundry-element', LaundryElement);