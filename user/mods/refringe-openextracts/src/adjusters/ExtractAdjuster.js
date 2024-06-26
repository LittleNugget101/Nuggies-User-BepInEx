"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtractAdjuster = void 0;
const OpenExtracts_1 = require("../OpenExtracts");
/**
 * The `ExtractAdjuster` class is responsible for orchestrating adjustments to game extracts according to a predefined
 * configuration. It contains methods to adjust individual and global extract properties based on the current
 * configuration settings.
 */
class ExtractAdjuster {
    // This is a mapping of location names as they are represented in the game to their configuration and human-readable
    // counterparts. This is used to convert the location name from the game to the name used in the configuration file.
    /* eslint-disable @typescript-eslint/naming-convention */
    static locationNameMappings = {
        bigmap: { config: "customs", human: "Customs" },
        factory4_day: { config: "factoryDay", human: "Factory (Day)" },
        factory4_night: { config: "factoryNight", human: "Factory (Night)" },
        interchange: { config: "interchange", human: "Interchange" },
        laboratory: { config: "laboratory", human: "Laboratory" },
        lighthouse: { config: "lighthouse", human: "Lighthouse" },
        rezervbase: { config: "reserve", human: "Reserve" },
        reservebase: { config: "reserve", human: "Reserve" }, // Duplicate entry to handle both potential inputs
        sandbox: { config: "groundZero", human: "Ground Zero" },
        shoreline: { config: "shoreline", human: "Shoreline" },
        tarkovstreets: { config: "streets", human: "Streets of Tarkov" },
        woods: { config: "woods", human: "Woods" },
    };
    /* eslint-enable @typescript-eslint/naming-convention */
    /**
     * Make the adjustments to the extracts once the class is instantiated.
     */
    constructor() {
        this.makeAdjustments();
    }
    /**
     * Orchestrates the adjustment of extracts according to the configuration. It iterates over enabled locations and
     * performs various adjustments on the extracts based on the rules defined in the configuration.
     */
    makeAdjustments() {
        const locations = OpenExtracts_1.OpenExtracts.container
            .resolve("DatabaseServer")
            .getTables().locations;
        const enabledLocations = ExtractAdjuster.getEnabledLocations();
        // Iterate over all of the enabled location's exits.
        for (const locationName of enabledLocations) {
            const location = locations[locationName].base;
            for (const extract of location.exits) {
                this.enableAllEntryPoints(extract, location);
                this.adjustChanceEnabled(extract, location);
                this.adjustMaximumExtractTime(extract, location);
                // We can finish here if this is a train extract.
                if (extract.PassageRequirement === "Train") {
                    continue;
                }
                this.convertCooperationToPayment(extract, location);
                this.adjustVehiclePayment(extract, location);
                this.resetTimerOnLeave(extract, location);
                this.removeBackpackRequirement(extract, location);
                this.removeCliffRequirements(extract, location);
            }
        }
        OpenExtracts_1.OpenExtracts.logger.log("OpenExtracts: Extracts have successfully adjusted according to the configuration.", "cyan");
    }
    /**
     * Retrieves a set of enabled location names for extract adjustments.
     */
    static getEnabledLocations() {
        return new Set([
            "bigmap",
            "factory4_day",
            "factory4_night",
            "interchange",
            "laboratory",
            "lighthouse",
            "rezervbase",
            "sandbox",
            "shoreline",
            "tarkovstreets",
            "woods",
        ]);
    }
    /**
     * Enables all entry points for a specified extract, making it usable regardless of the player's spawn location.
     */
    enableAllEntryPoints(extract, location) {
        if (!OpenExtracts_1.OpenExtracts.config.extracts.ignoreEntryPoint) {
            // Option has been disabled in the configuration file.
            return;
        }
        // Dynamically get all of the entry points for this location.
        const allEntryPoints = this.getAllEntryPoints(location);
        // Update the database and log it if debug is enabled.
        if (extract.EntryPoints !== allEntryPoints) {
            extract.EntryPoints = allEntryPoints;
            if (OpenExtracts_1.OpenExtracts.config.general.debug) {
                OpenExtracts_1.OpenExtracts.logger.log(`OpenExtracts: ${extract.Name.trim()} on ${this.getLocationName(location.Id, "human")} has been updated to allow all entry points: ${allEntryPoints}.`, "gray");
            }
        }
    }
    /**
     * Adjusts the probability of the extract being enabled based on the configuration settings.
     */
    adjustChanceEnabled(extract, location) {
        if (!OpenExtracts_1.OpenExtracts.config.extracts.random.enabled) {
            // Option has been disabled in the configuration file.
            return;
        }
        const locationConfig = OpenExtracts_1.OpenExtracts.config.extracts.random.chances[this.getLocationName(location.Id, "config")];
        // Return early if we can't find the configuration information for this extract.
        if (locationConfig === undefined || locationConfig[extract.Name.trim()] === undefined) {
            return;
        }
        const configChance = locationConfig[extract.Name.trim()];
        if (configChance !== extract.Chance) {
            const originalChance = extract.Chance;
            extract.Chance = configChance;
            if (OpenExtracts_1.OpenExtracts.config.general.debug) {
                OpenExtracts_1.OpenExtracts.logger.log(`OpenExtracts: ${extract.Name.trim()} on ${this.getLocationName(location.Id, "human")} has had its chance to be enabled changed from ${originalChance}% to ${configChance}%.`, "gray");
            }
        }
    }
    /**
     * Modifies the maximum extraction time of an extract based on the predefined configuration settings.
     */
    adjustMaximumExtractTime(extract, location) {
        const originalExtractTime = extract.ExfiltrationTime;
        const maxTime = OpenExtracts_1.OpenExtracts.config.extracts.maxExtractionTime;
        if (originalExtractTime <= maxTime) {
            // The original extraction time is already less than or equal to the maximum extraction time.
            return;
        }
        extract.ExfiltrationTime = maxTime;
        if (OpenExtracts_1.OpenExtracts.config.general.debug) {
            OpenExtracts_1.OpenExtracts.logger.log(`OpenExtracts: ${extract.Name.trim()} on ${this.getLocationName(location.Id, "human")} has had its extraction time updated from ${originalExtractTime} seconds to ${maxTime} seconds.`, "gray");
        }
    }
    /**
     * Converts a cooperation extract to a payment extract according to the configuration settings.
     */
    convertCooperationToPayment(extract, location) {
        if (!OpenExtracts_1.OpenExtracts.config.extracts.cooperation.convertToPayment) {
            // Option has been disabled in the configuration file.
            return;
        }
        if (!this.isCooperationExtract(extract)) {
            // This isn't a cooperation extract;
            return;
        }
        extract.PassageRequirement = "TransferItem";
        extract.RequirementTip = "EXFIL_Item";
        extract.Id = OpenExtracts_1.OpenExtracts.config.extracts.cooperation.item;
        extract.Count = OpenExtracts_1.OpenExtracts.config.extracts.cooperation.number;
        if (OpenExtracts_1.OpenExtracts.config.general.debug) {
            OpenExtracts_1.OpenExtracts.logger.log(`OpenExtracts: ${extract.Name.trim()} on ${this.getLocationName(location.Id, "human")} has been converted to a payment extract.`, "gray");
        }
    }
    /**
     * Determines whether the specified extract is a cooperation extract.
     */
    isCooperationExtract(extract) {
        return extract.PassageRequirement === "ScavCooperation";
    }
    /**
     * Removes the backpack requirement from an extract based on the configuration settings.
     */
    removeBackpackRequirement(extract, location) {
        if (!OpenExtracts_1.OpenExtracts.config.extracts.ignoreBackpackRequirements) {
            // Option has been disabled in the configuration file.
            return;
        }
        if (!ExtractAdjuster.isBackpackExtract(extract)) {
            // This isn't a backpack extract;
            return;
        }
        extract.PassageRequirement = "None";
        extract.RequiredSlot = "FirstPrimaryWeapon";
        extract.RequirementTip = "";
        if (OpenExtracts_1.OpenExtracts.config.general.debug) {
            OpenExtracts_1.OpenExtracts.logger.log(`OpenExtracts: ${extract.Name.trim()} on ${this.getLocationName(location.Id, "human")} has had its backpack requirement removed.`, "gray");
        }
    }
    /**
     * Determines whether the specified extract has a backpack requirement.
     */
    static isBackpackExtract(extract) {
        return (ExtractAdjuster.getBackpackExtractRequirementTips().has(extract.RequirementTip) &&
            extract.RequiredSlot === "Backpack");
    }
    /**
     * Retrieves a set of backpack extract requirement tips.
     */
    static getBackpackExtractRequirementTips() {
        return new Set(["EXFIL_tip_backpack", "EXFIL_INTERCHANGE_HOLE_TIP"]);
    }
    /**
     * Removes the cliff requirement from an extract based on the configuration settings.
     */
    removeCliffRequirements(extract, location) {
        if (!OpenExtracts_1.OpenExtracts.config.extracts.ignoreCliffRequirements) {
            // Option has been disabled in the configuration file.
            return;
        }
        if (!this.isCliffExtract(extract)) {
            // This isn't a cliff extract.
            return;
        }
        extract.Id = "";
        extract.PassageRequirement = "None";
        if (OpenExtracts_1.OpenExtracts.config.general.debug) {
            OpenExtracts_1.OpenExtracts.logger.log(`OpenExtracts: ${extract.Name.trim()} on ${this.getLocationName(location.Id, "human")} has had its paracord, red rebel, and armored rig requirements removed.`, "gray");
        }
    }
    /**
     * Determines whether the specified extract is a cliff extract.
     */
    isCliffExtract(extract) {
        return extract.Name.trim().toLowerCase().includes("alp") && extract.PassageRequirement === "Reference";
    }
    /**
     * Retrieves a comma-separated string representing all entry points for a given location.
     */
    getAllEntryPoints(location) {
        const entryPointsSet = new Set();
        for (const extract in location.exits) {
            const entryPoints = location.exits[extract].EntryPoints.split(",");
            for (const entryPoint of entryPoints) {
                entryPointsSet.add(entryPoint);
            }
        }
        return Array.from(entryPointsSet).join(",");
    }
    /**
     * Retrieves the formatted location name based on the specified type. The method consults the `locationNameMappings`
     * object to find the matching name according to the given type.
     */
    getLocationName(gameLocationName, nameType) {
        const location = gameLocationName.toLowerCase();
        return ExtractAdjuster.locationNameMappings[location]?.[nameType] || location;
    }
    /**
     * Adjusts the vehicle payment item information.
     */
    adjustVehiclePayment(extract, location) {
        if (!OpenExtracts_1.OpenExtracts.config.extracts.vehicle.adjustPayment) {
            // Option has been disabled in the configuration file.
            return;
        }
        if (!this.isVehicleExtract(extract)) {
            // This isn't a vehicle extract.
            return;
        }
        extract.Id = OpenExtracts_1.OpenExtracts.config.extracts.vehicle.item;
        extract.Count = OpenExtracts_1.OpenExtracts.config.extracts.vehicle.number;
        if (OpenExtracts_1.OpenExtracts.config.general.debug) {
            OpenExtracts_1.OpenExtracts.logger.log(`OpenExtracts: ${extract.Name.trim()} on ${this.getLocationName(location.Id, "human")} has had payment options adjusted.`, "gray");
        }
    }
    /**
     * Determines whether the specified extract is a vehicle extract.
     */
    isVehicleExtract(extract) {
        const vehicleExtracts = [
            "dorms v-ex",
            "pp exfil",
            "v-ex_light",
            "south v-ex",
            "e7_car",
            "sandbox_vexit",
            "shorl_v-ex",
        ];
        return (extract.Name.trim().toLowerCase().includes("v-ex") ||
            vehicleExtracts.includes(extract.Name.trim().toLowerCase()));
    }
    /**
     * This will cause the timer for an extract to reset when a player leaves the extract zone.
     */
    resetTimerOnLeave(extract, location) {
        if (!OpenExtracts_1.OpenExtracts.config.extracts.resetTimerOnLeave) {
            // Option has been disabled in the configuration file.
            return;
        }
        if (!this.isVehicleExtract(extract) && !this.isCooperationExtract(extract)) {
            // This isn't a compatible extract.
            return;
        }
        extract.ExfiltrationType = "Individual";
        extract.PlayersCount = 0;
        if (OpenExtracts_1.OpenExtracts.config.general.debug) {
            OpenExtracts_1.OpenExtracts.logger.log(`OpenExtracts: ${extract.Name.trim()} on ${this.getLocationName(location.Id, "human")} will have the extract timer reset on leave.`, "gray");
        }
    }
}
exports.ExtractAdjuster = ExtractAdjuster;
//# sourceMappingURL=ExtractAdjuster.js.map