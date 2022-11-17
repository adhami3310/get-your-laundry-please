"use strict";
const materialStates = new Set(["OFF", "ON", "UNKNOWN", "BROKEN"]);
const materialStyles = `
@import url("https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200");

.laundry-machine {
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    --off: yellowgreen;
    --on: #7b0000;
    border: 1px solid var(--outline);
    background: var(--surface);
    border-radius: 12px;
}

.laundry-machine {
    padding: 1em;
}

#swatch {
    font-size: 3em;
    font-weight: 600;
}

.subhead {
    font-size: 1.5em;
}

.since {
    display: inline-block;
    font-style: italic;
}

.notif {
    display: none;
    appearance: none;
    border: none;
    border-radius: 100%;
    height: 40px;
    aspect-ratio : 1 / 1;
    margin-top: auto;
    margin-left: 5px;
    background: none;
    color: var(--on-surface);
    cursor: pointer;
    padding: 0;
}

.off {
    background: var(--on-surface-variant-focus);
}

.notif.active {
    color: var(--primary);
}

.notif:hover {
    background: var(--on-surface-variant-hover);
}

.notif:active {
    background: var(--on-surface-variant-focus);
}

.notif .material-symbols-outlined::before {
    content: 'notifications';
}

.notif.active .material-symbols-outlined::before {
    content: 'notifications_active';
}

.broken,.unknown {
    opacity: 12%;
}

.on .notif {
    display: block;
}

.since::before {
    content: '- ';
}

.material-symbols-outlined {
    font-variation-settings:
    'FILL' 1,
    'wght' 200,
    'GRAD' 0,
    'opsz' 40
}

.name {
    display: inline-block;
}

.text {
    line-height: 3em;
    display: flex;
    flex-direction: column;
}

.top {
    display: flex;
    justify-content: space-between;
}

`;
class LaundryMaterialElement extends HTMLElement {
    machineState = "UNKNOWN";
    lastTransition = Date.now().toString();
    callbacks = [];
    notifState = false;
    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.innerHTML = `<style>${materialStyles}</style>
        <div class="laundry-machine unknown">
            <div class="text">
                <div class="top">
                    <div id="swatch"></div>
                    <button class="notif"><span class="material-symbols-outlined"></span></button>
                </div>
                <div class="bottom">
                    <div class="subhead">
                        <div class="name">Washer</div>
                        <div class="since"></div>
                    </div>
                </div>
            </div>
        </div>
        `;
        shadowRoot.addEventListener("click", (ev) => {
            const target = ev.target;
            if (this.shadowRoot?.querySelector(".notif")?.contains(target)) {
                this.notifToggle();
            }
        });
    }
    get state() {
        return this.machineState;
    }
    set state(v) {
        v = v.toUpperCase();
        if (!materialStates.has(v))
            return;
        this.machineState = v;
        this.setAttribute("state", v);
    }
    get transition() {
        return this.lastTransition;
    }
    addNotificationToggle(callback) {
        this.callbacks.push(callback);
    }
    notifToggle() {
        this.callbacks.forEach(callback => {
            callback(this.notifState);
        });
        this.notifState = !this.notifState;
        this.shadowRoot?.querySelector(".notif")?.classList.toggle("active");
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
            if (!materialStates.has(newValue))
                return;
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
    render() {
        const swatch = this.shadowRoot?.querySelector("#swatch");
        const since = this.shadowRoot?.querySelector(".since");
        if (swatch !== undefined && swatch !== null && since !== undefined && since !== null) {
            if (this.state === "OFF") {
                swatch.innerHTML = `Free`;
                since.innerHTML = `since ${LaundryMaterialElement.getSince(this.lastTransition)}m`;
            }
            else if (this.state === "ON") {
                swatch.innerHTML = `On`;
                since.innerHTML = `since ${LaundryMaterialElement.getSince(this.lastTransition)}m`;
            }
            else if (this.state === "UNKNOWN") {
                swatch.innerHTML = "Unknown";
                since.innerHTML = "";
            }
            else {
                swatch.innerHTML = "Broken";
                since.innerHTML = "";
            }
        }
    }
}
customElements.define('laundry-element', LaundryMaterialElement);
//# sourceMappingURL=LaundryMaterialElement.js.map