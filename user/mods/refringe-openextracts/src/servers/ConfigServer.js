"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigServer = void 0;
const ajv_1 = __importDefault(require("ajv"));
const fs = __importStar(require("node:fs"));
const json5 = __importStar(require("C:/snapshot/project/node_modules/json5"));
const node_path_1 = require("node:path");
const ConfigSchema_1 = require("../schemas/ConfigSchema");
/**
 * ConfigServer Class
 *
 * The ConfigServer class is responsible for managing the application's configuration settings.
 * It provides functionality to load and validate a configuration file, which is specified in JSON5 format.
 * The class checks the validity of the configuration and ensures that they match the schema.
 */
class ConfigServer {
    relativeConfigPath;
    configPath;
    config = null;
    isLoaded = false;
    isValid = false;
    ajv;
    validate;
    configSchema;
    /**
     * Constructs a new ConfigServer instance.
     * Automatically loads and validates the configuration file specified by the relative path.
     */
    constructor(relativeConfigPath = "../../config/config.json5") {
        this.relativeConfigPath = relativeConfigPath;
        this.configPath = this.buildConfigPath();
        this.ajv = new ajv_1.default();
        this.configSchema = ConfigSchema_1.ConfigSchema.schema;
        this.validate = this.ajv.compile(this.configSchema);
    }
    /**
     * Constructs the absolute path to the configuration file based on its relative path.
     */
    buildConfigPath() {
        return (0, node_path_1.join)(__dirname, this.relativeConfigPath);
    }
    /**
     * Loads the configuration from a file.
     * Sets the `isLoaded` flag to true if successful, false otherwise.
     * Throws a ConfigError if the file cannot be loaded.
     */
    loadConfig() {
        try {
            const configFileContent = fs.readFileSync(this.configPath, "utf-8");
            this.config = json5.parse(configFileContent); // Still needs validation.
            this.isLoaded = true;
        }
        catch (error) {
            this.config = null;
            this.isLoaded = false;
            this.isValid = false;
            throw new Error("CONFIG_LOAD_ERROR - Could not load configuration");
        }
        return this;
    }
    /**
     * Validates the loaded configuration.
     * Sets the `isValid` flag to true if the validation is successful, false otherwise.
     * Throws a ConfigError if the configuration is not loaded or is invalid.
     */
    validateConfig() {
        if (!this.isLoaded) {
            throw new Error("CONFIG_NOT_LOADED - Configuration not loaded");
        }
        if (this.config === null) {
            throw new Error("CONFIG_IS_NULL - Configuration is null");
        }
        const valid = this.validate(this.config);
        if (!valid) {
            this.config = null;
            this.isValid = false;
            throw new Error(`CONFIG_VALIDATION_ERROR - Configuration validation failed - ${this.ajv.errorsText(this.validate.errors)}`);
        }
        this.config = this.config; // Safe cast after validation.
        this.isValid = true;
        return this;
    }
    /**
     * Type guard for the Configuration type.
     */
    isConfiguration(config) {
        return this.validate(config);
    }
    /**
     * Retrieves the loaded and validated configuration.
     */
    getConfig() {
        if (!this.isValid) {
            throw new Error("CONFIG_INVALID - Configuration not valid or not loaded");
        }
        if (this.config !== null && this.isConfiguration(this.config)) {
            return this.config;
        }
        return null;
    }
}
exports.ConfigServer = ConfigServer;
//# sourceMappingURL=ConfigServer.js.map