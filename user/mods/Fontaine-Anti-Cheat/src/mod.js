"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const ContextVariableType_1 = require("C:/snapshot/project/obj/context/ContextVariableType");
const raidInfo = require("../db/savedInfo.json");
const modConfig = require("../db/config.json");
class Mod {
    preAkiLoad(container) {
        const logger = container.resolve("WinstonLogger");
        const staticRouterModService = container.resolve("StaticRouterModService");
        const HttpResponse = container.resolve("HttpResponseUtil");
        const utils = new utils_1.Utils();
        staticRouterModService.registerStaticRouter("ACcheckProfile", [
            {
                url: "/client/game/version/validate",
                action: (url, info, sessionID, output) => {
                    try {
                        const profileHelper = container.resolve("ProfileHelper");
                        const inRaidHelper = container.resolve("InRaidHelper");
                        let pmcData = profileHelper.getPmcProfile(sessionID);
                        if (modConfig.enable_ac == true) {
                            this.checkRaidStatus(pmcData, inRaidHelper, sessionID, logger);
                            this.setRaidStatus(utils, false, true, pmcData);
                        }
                        return HttpResponse.nullResponse();
                    }
                    catch (e) {
                        logger.error("Fontaine's Anti-Cheat: Error Checking Player Profile: " + e);
                        return HttpResponse.nullResponse();
                    }
                }
            }
        ], "AntiCheat");
        staticRouterModService.registerStaticRouter("ACrunAtRaidStart", [
            {
                url: "/client/raid/configuration",
                action: (url, info, sessionID, output) => {
                    try {
                        const profileHelper = container.resolve("ProfileHelper");
                        let pmcData = profileHelper.getPmcProfile(sessionID);
                        const appContext = container.resolve("ApplicationContext");
                        const raidConfigData = appContext.getLatestValue(ContextVariableType_1.ContextVariableType.RAID_CONFIGURATION)?.getValue();
                        if (modConfig.enable_ac == true && raidConfigData.side !== "Savage") {
                            this.setRaidStatus(utils, true, false, pmcData);
                        }
                        return HttpResponse.nullResponse();
                    }
                    catch (e) {
                        logger.error("Fontaine's Anti-Cheat: Error Checking Player Profile: " + e);
                        return HttpResponse.nullResponse();
                    }
                }
            }
        ], "AntiCheat");
        staticRouterModService.registerStaticRouter("ACrunAtRaidEnd", [
            {
                url: "/raid/profile/save",
                action: (url, info, sessionID, output) => {
                    try {
                        const profileHelper = container.resolve("ProfileHelper");
                        let pmcData = profileHelper.getPmcProfile(sessionID);
                        this.setRaidStatus(utils, false, true, pmcData);
                        return HttpResponse.nullResponse();
                    }
                    catch (e) {
                        logger.error("Fontaine's Anti-Cheat: Error Checking Player Profile: " + e);
                        return HttpResponse.nullResponse();
                    }
                }
            }
        ], "AntiCheat");
    }
    setRaidStatus(utils, enteredRaid, exitedRaid, playerData) {
        raidInfo.profile_id = playerData._id;
        raidInfo.entered_raid = enteredRaid;
        raidInfo.exited_raid = exitedRaid;
        utils.saveToJSONFile(raidInfo, 'db/savedInfo.json');
    }
    checkRaidStatus(playerData, inRaidController, sessionID, logger) {
        if (raidInfo.exited_raid == false && raidInfo.entered_raid == true && raidInfo.profile_id === playerData._id) {
            inRaidController.deleteInventory(playerData, sessionID);
            logger.warning("Anti Cheat: raid not exited, deleting inventory.");
        }
        else {
            logger.success("Anti Cheat: raid exited, inventory is safe.");
        }
    }
}
module.exports = { mod: new Mod() };
//# sourceMappingURL=mod.js.map