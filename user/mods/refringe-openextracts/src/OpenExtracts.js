"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenExtracts = void 0;
const ExtractAdjuster_1 = require("./adjusters/ExtractAdjuster");
const ConfigServer_1 = require("./servers/ConfigServer");
/**
 * The main class of the OpenExtracts mod.
 */
class OpenExtracts {
    static container;
    static logger;
    static config = null;
    /**
     * Handle loading the configuration file and registering our custom MatchCallbacks class.
     * Runs before the database is loaded.
     */
    preAkiLoad(container) {
        OpenExtracts.container = container;
        // Resolve the logger and save it to the static logger property for simple access.
        OpenExtracts.logger = container.resolve("WinstonLogger");
        // Load and validate the configuration file, saving it to the static config property for simple access.
        try {
            OpenExtracts.config = new ConfigServer_1.ConfigServer().loadConfig().validateConfig().getConfig();
        }
        catch (error) {
            OpenExtracts.config = null; // Set the config to null so we know it's failed to load or validate.
            OpenExtracts.logger.log(`OpenExtracts: ${error.message}`, "red");
        }
        // Set a flag so we know that we shouldn't continue when the postDBLoad method fires... just setting the config
        // back to null should do the trick. Use optional chaining because we have not yet checked if the config is
        // loaded and valid yet.
        if (OpenExtracts.config?.general?.enabled === false) {
            OpenExtracts.config = null;
            OpenExtracts.logger.log("OpenExtracts is disabled in the config file.", "red");
        }
        // If the configuration is null at this point we can stop here.
        if (OpenExtracts.config === null) {
            return;
        }
    }
    /**
     * Trigger the changes to extracts once the database has loaded.
     */
    postDBLoad() {
        // If the configuration is null at this point we can stop here. This will happen if the configuration file
        // failed to load, failed to validate, or if the mod is disabled in the configuration file.
        if (OpenExtracts.config === null) {
            return;
        }
        // Modify the extracts based on the configuration.
        new ExtractAdjuster_1.ExtractAdjuster();
    }
}
exports.OpenExtracts = OpenExtracts;
module.exports = { mod: new OpenExtracts() };
//# sourceMappingURL=OpenExtracts.js.map