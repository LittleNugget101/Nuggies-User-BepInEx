import { DependencyContainer } from "tsyringe";
import { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import type { StaticRouterModService } from "@spt-aki/services/mod/staticRouter/StaticRouterModService";
import { HttpResponseUtil } from "@spt-aki/utils/HttpResponseUtil";
import { IPmcData } from "@spt-aki/models/eft/common/IPmcData";
import { InRaidHelper } from "@spt-aki/helpers/InRaidHelper";
import { ProfileHelper } from "@spt-aki/helpers/ProfileHelper";
import { IGetRaidConfigurationRequestData } from "@spt-aki/models/eft/match/IGetRaidConfigurationRequestData";
import { Utils } from "./utils"
import { ApplicationContext } from "@spt-aki/context/ApplicationContext";
import { ContextVariableType } from "@spt-aki/context/ContextVariableType";

const raidInfo = require("../db/savedInfo.json");
const modConfig = require("../db/config.json");

class Mod implements IPreAkiLoadMod {

    preAkiLoad(container: DependencyContainer): void {
        const logger = container.resolve<ILogger>("WinstonLogger");
        const staticRouterModService = container.resolve<StaticRouterModService>("StaticRouterModService");
        const HttpResponse = container.resolve<HttpResponseUtil>("HttpResponseUtil");
        const utils = new Utils();

        staticRouterModService.registerStaticRouter(
            "ACcheckProfile",
            [
                {
                    url: "/client/game/version/validate",
                    action: (url, info, sessionID, output) => {

                        try {
                            const profileHelper = container.resolve<ProfileHelper>("ProfileHelper");
                            const inRaidHelper = container.resolve<InRaidHelper>("InRaidHelper");
                            let pmcData = profileHelper.getPmcProfile(sessionID);
                            if(modConfig.enable_ac == true){
                                this.checkRaidStatus(pmcData, inRaidHelper, sessionID, logger);
                                this.setRaidStatus(utils, false, true, pmcData)
                            }

                            return HttpResponse.nullResponse();
                        }
                        catch (e) {
                            logger.error("Fontaine's Anti-Cheat: Error Checking Player Profile: " + e);
                            return HttpResponse.nullResponse();
                        }
                    }
                }
            ],
            "AntiCheat"
        );

        staticRouterModService.registerStaticRouter(
            "ACrunAtRaidStart",
            [
                {
                    url: "/client/raid/configuration",
                    action: (url, info, sessionID, output) => {
                        try {
                            const profileHelper = container.resolve<ProfileHelper>("ProfileHelper");
                            let pmcData = profileHelper.getPmcProfile(sessionID);
                            const appContext = container.resolve<ApplicationContext>("ApplicationContext");
                            const raidConfigData = appContext.getLatestValue(ContextVariableType.RAID_CONFIGURATION)?.getValue<IGetRaidConfigurationRequestData>();

                            if(modConfig.enable_ac == true && raidConfigData.side !== "Savage"){
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
            ],
            "AntiCheat"
        );

        staticRouterModService.registerStaticRouter(
            "ACrunAtRaidEnd",
            [
                {
                    url: "/raid/profile/save",
                    action: (url, info, sessionID, output) => {
                        try {
                            const profileHelper = container.resolve<ProfileHelper>("ProfileHelper");
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
            ],
            "AntiCheat"
        );
    }

    private setRaidStatus(utils: Utils, enteredRaid: boolean, exitedRaid: boolean, playerData: IPmcData) {
        raidInfo.profile_id = playerData._id;
        raidInfo.entered_raid = enteredRaid;
        raidInfo.exited_raid = exitedRaid;
        utils.saveToJSONFile(raidInfo, 'db/savedInfo.json');
    }

    private checkRaidStatus(playerData: IPmcData, inRaidController: InRaidHelper, sessionID: string, logger: ILogger) {
        if (raidInfo.exited_raid == false && raidInfo.entered_raid == true && raidInfo.profile_id === playerData._id) {
            inRaidController.deleteInventory(playerData, sessionID);
            logger.warning("Anti Cheat: raid not exited, deleting inventory.");
        } else {
            logger.success("Anti Cheat: raid exited, inventory is safe.");
        }
    }
}

module.exports = { mod: new Mod() }