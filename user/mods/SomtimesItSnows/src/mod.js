"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_json_1 = require("../config/config.json");
const ConfigTypes_1 = require("C:/snapshot/project/obj/models/enums/ConfigTypes");
class SomtimesItSnows {
    preAkiLoad(container) {
        const configServer = container.resolve("ConfigServer");
        const WeatherValues = configServer.getConfig(ConfigTypes_1.ConfigTypes.WEATHER);
        const staticRouterModService = container.resolve("StaticRouterModService");
        config_json_1.enable &&
            staticRouterModService.registerStaticRouter(`SomtimesItSnows`, [
                {
                    url: "/client/raid/configuration",
                    action: (_url, info, sessionId, output) => {
                        WeatherValues.forceWinterEvent = false;
                        if (Math.random() < config_json_1.winterChance) {
                            WeatherValues.forceWinterEvent = true;
                        }
                        return output;
                    },
                },
            ], "aki");
    }
}
module.exports = { mod: new SomtimesItSnows() };
//# sourceMappingURL=mod.js.map