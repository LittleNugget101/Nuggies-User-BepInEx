"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Container_1 = require("./di/Container");
class Mod {
    async preAkiLoadAsync(container) {
        Container_1.Container.register(container);
        await container.resolve("Fika").preAkiLoad(container);
    }
}
module.exports = { mod: new Mod() };
//# sourceMappingURL=mod.js.map