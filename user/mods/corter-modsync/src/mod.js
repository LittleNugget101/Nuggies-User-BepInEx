"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mod = void 0;
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
class Mod {
    static container;
    clientModLastUpdated = 0;
    clientModHashes;
    serverModHashes;
    preAkiLoad(container) {
        Mod.container = container;
        const httpListenerService = container.resolve("HttpListenerModService");
        httpListenerService.registerHttpListener("ModSyncListener", this.canHandleOverride, this.handleOverride);
    }
    canHandleOverride(_sessionId, req) {
        return req.url?.startsWith("/modsync/") ?? false;
    }
    async handleOverride(_sessionId, req, resp) {
        const logger = Mod.container.resolve("WinstonLogger");
        const vfs = Mod.container.resolve("VFS");
        const hashUtil = Mod.container.resolve("HashUtil");
        const httpFileUtil = Mod.container.resolve("HttpFileUtil");
        const jsonUtil = Mod.container.resolve("JsonUtil");
        const { clientDirs, serverDirs, commonModExclusions } = jsonUtil.deserializeJsonC(await vfs.readFileAsync(node_path_1.default.join(__dirname, "config.jsonc")), "config.jsonc");
        const commonModExclusionsRegex = commonModExclusions.map((exclusion) => new RegExp(exclusion
            .split(node_path_1.default.posix.sep)
            .join(node_path_1.default.sep)
            .replaceAll("\\", "\\\\")));
        if (clientDirs.some((dir) => node_path_1.default.isAbsolute(dir) ||
            node_path_1.default
                .relative(process.cwd(), node_path_1.default.resolve(process.cwd(), dir))
                .startsWith("..")))
            logger.error("Invalid clientDirs in config.json. Ensure directories are relative to the SPT server directory (ie. BepInEx/plugins)");
        if (serverDirs.some((dir) => node_path_1.default.isAbsolute(dir) ||
            node_path_1.default
                .relative(process.cwd(), node_path_1.default.resolve(process.cwd(), dir))
                .startsWith("..")))
            logger.error("Invalid serverDirs in config.json. Ensure directories are relative to the SPT server directory (ie. user/mods)");
        const getFileHashes = async (dirs) => {
            const getFilesInDir = (dir) => {
                try {
                    return [
                        ...vfs
                            .getFiles(dir)
                            .map((file) => node_path_1.default.join(dir, file))
                            .filter((file) => !file.endsWith(".nosync") &&
                            !file.endsWith(".nosync.txt") &&
                            !vfs.exists(`${file}.nosync`) &&
                            !vfs.exists(`${file}.nosync.txt`) &&
                            !commonModExclusionsRegex.some((exclusion) => exclusion.test(file))),
                        ...vfs
                            .getDirs(dir)
                            .map((subDir) => node_path_1.default.join(dir, subDir))
                            .filter((subDir) => !vfs.exists(node_path_1.default.join(subDir, ".nosync")) &&
                            !vfs.exists(node_path_1.default.join(subDir, ".nosync.txt")) &&
                            !commonModExclusionsRegex.some((exclusion) => exclusion.test(subDir)))
                            .flatMap((subDir) => getFilesInDir(subDir)),
                    ];
                }
                catch {
                    return [];
                }
            };
            const buildModFile = (file) => {
                const modified = node_fs_1.default.statSync(file).mtime;
                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                const dir = dirs.find((dir) => !node_path_1.default.relative(dir, file).startsWith(".."));
                return [
                    node_path_1.default
                        .join(dir, node_path_1.default.relative(dir, file))
                        .split(node_path_1.default.sep)
                        .join(node_path_1.default.win32.sep),
                    {
                        crc: hashUtil.generateCRC32ForFile(file),
                        modified: new Date(modified.getTime() + modified.getTimezoneOffset() * 60000).getTime(),
                    },
                ];
            };
            return Object.assign({}, ...dirs
                .map((dir) => node_path_1.default.join(process.cwd(), dir))
                .map((dir) => Object.fromEntries(getFilesInDir(dir).map(buildModFile))));
        };
        const sanitizeFilePath = (file, allowedSubDirs) => {
            const sanitizedPath = node_path_1.default.join(node_path_1.default.normalize(file).replace(/^(\.\.(\/|\\|$))+/, ""));
            return (!allowedSubDirs.every((subDir) => node_path_1.default
                .relative(node_path_1.default.join(process.cwd(), subDir), sanitizedPath)
                .startsWith("..")) && sanitizedPath);
        };
        try {
            if (req.url === "/modsync/version") {
                const packageJson = JSON.parse(vfs.readFile(node_path_1.default.resolve(__dirname, "../package.json")));
                resp.setHeader("Content-Type", "application/json");
                resp.writeHead(200, "OK");
                resp.end(JSON.stringify({ version: packageJson.version }));
            }
            else if (req.url === "/modsync/client/dirs") {
                resp.setHeader("Content-Type", "application/json");
                resp.writeHead(200, "OK");
                resp.end(JSON.stringify(clientDirs.map((dir) => dir.split(node_path_1.default.posix.sep).join(node_path_1.default.win32.sep))));
            }
            else if (req.url === "/modsync/server/dirs") {
                resp.setHeader("Content-Type", "application/json");
                resp.writeHead(200, "OK");
                resp.end(JSON.stringify(serverDirs.map((dir) => dir.split(node_path_1.default.posix.sep).join(node_path_1.default.win32.sep))));
            }
            else if (req.url === "/modsync/client/hashes") {
                const clientModUpdated = Math.max(...clientDirs.map((dir) => node_fs_1.default.statSync(dir).mtimeMs));
                if (this.clientModHashes === undefined ||
                    clientModUpdated > this.clientModLastUpdated) {
                    this.clientModLastUpdated = clientModUpdated;
                    this.clientModHashes = await getFileHashes(clientDirs);
                }
                resp.setHeader("Content-Type", "application/json");
                resp.writeHead(200, "OK");
                resp.end(JSON.stringify(this.clientModHashes));
            }
            else if (req.url === "/modsync/server/hashes") {
                if (this.serverModHashes === undefined) {
                    this.serverModHashes = await getFileHashes(serverDirs);
                }
                resp.setHeader("Content-Type", "application/json");
                resp.writeHead(200, "OK");
                resp.end(JSON.stringify(this.serverModHashes));
            }
            else if (req.url?.startsWith("/modsync/client/fetch/")) {
                const filePath = decodeURIComponent(
                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                req.url.split("/modsync/client/fetch/").at(-1));
                const sanitizedPath = sanitizeFilePath(filePath, clientDirs);
                if (!sanitizedPath) {
                    logger.warning(`Attempt to access invalid path ${filePath}`);
                    resp.writeHead(400, "Bad request");
                    resp.end("Invalid path");
                    return;
                }
                if (!vfs.exists(sanitizedPath)) {
                    logger.warning(`Attempt to access non-existent path ${filePath}`);
                    resp.writeHead(404, "Not found");
                    resp.end(`File ${filePath} not found`);
                    return;
                }
                httpFileUtil.sendFile(resp, sanitizedPath);
            }
            else if (req.url?.startsWith("/modsync/server/fetch/")) {
                const filePath = decodeURIComponent(
                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                req.url.split("/modsync/server/fetch/").at(-1));
                const sanitizedPath = sanitizeFilePath(filePath, serverDirs);
                if (!sanitizedPath) {
                    logger.warning(`Attempt to access invalid path ${filePath}`);
                    resp.writeHead(400, "Bad request");
                    resp.end("Invalid path");
                    return;
                }
                if (!vfs.exists(sanitizedPath)) {
                    logger.warning(`Attempt to access non-existent path ${filePath}`);
                    resp.writeHead(404, "Not found");
                    resp.end(`File ${filePath} not found`);
                    return;
                }
                httpFileUtil.sendFile(resp, sanitizedPath);
            }
            else {
                logger.warning(`No route found for ${req.url}`);
                resp.writeHead(404, "Not found");
                resp.end(`No route found for ${req.url}`);
            }
        }
        catch (e) {
            if (e instanceof Error) {
                logger.error(e.toString());
                resp.writeHead(500, "Internal server error");
                resp.end(e.toString());
            }
        }
    }
}
exports.mod = new Mod();
//# sourceMappingURL=mod.js.map