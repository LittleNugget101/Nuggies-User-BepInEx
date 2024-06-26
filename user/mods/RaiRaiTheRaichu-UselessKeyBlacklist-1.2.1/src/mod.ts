import { DependencyContainer } from "tsyringe";
import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { IItemConfig } from "@spt-aki/models/spt/config/IItemConfig";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";

class KeyBlacklist implements IPostDBLoadMod
{
    postDBLoad(container: DependencyContainer): void
    {
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        const configServer = container.resolve<ConfigServer>("ConfigServer");
        const itemConfig = configServer.getConfig<IItemConfig>(ConfigTypes.ITEM);

        // The following keys will be disabled from spawning, as best as I can.
        // Delete any entry and it will be able to spawn again.
        const keyBlacklist =
            [
                "59136f6f86f774447a1ed173", //Folding car key
                "5a0f045e86f7745b0f0d0e42", //Gas station safe key
                "5a0ea69f86f7741cd5406619", //Health Resort east wing office room 108 key
                "5a0ee72c86f77436955d3435", //Health Resort east wing room 213 key
                "5a0ee76686f7743698200d5c", //Health Resort east wing room 216 key
                "5a0eedb386f77403506300be", //Health Resort east wing room 322 key
                "5a0ec70e86f7742c0b518fba", //Health Resort west wing room 207 key
                "5a0eeb1a86f774688b70aa5c", //Health Resort west wing room 303 key
                "5a0eeb8e86f77461257ed71a", //Health Resort west wing room 309 key
                "5a13ee1986f774794d4c14cd", //Health Resort west wing room 323 key
                "5a0eebed86f77461230ddb3d", //Health Resort west wing room 325 key
                "63a39f18c2d53c2c6839c1d3", //Pinewood hotel room 206 key
                "6391fcf5744e45201147080f", //Primorsky Ave apartment key
                "5d80cb8786f774405611c7d9", //RB-PP key
                "5a0f006986f7741ffd2fe484"  //Weather station safe key
            ];

        for (const key in keyBlacklist) 
        {
            // Background color to red
            databaseServer.getTables().templates.items[keyBlacklist[key]]._props.BackgroundColor = "red";

            // Add note to top of the key description
            for (const locale in databaseServer.getTables().locales.global) 
            {
                let oldDesc = databaseServer.getTables().locales.global[locale][`${keyBlacklist[key]} Description`];
                let newDesc = "UNUSED\n\n" + oldDesc;
                databaseServer.getTables().locales.global[locale][`${keyBlacklist[key]} Description`] = newDesc;
            }

            // Remove from bot loot tables
            for (const botType in databaseServer.getTables().bots.types)
            {
                if (keyBlacklist[key] in databaseServer.getTables().bots.types[botType].inventory.items.Pockets)
                {
                    delete databaseServer.getTables().bots.types[botType].inventory.items.Pockets[keyBlacklist[key]];
                }

                if (keyBlacklist[key] in databaseServer.getTables().bots.types[botType].inventory.items.Backpack)
                {
                    delete databaseServer.getTables().bots.types[botType].inventory.items.Backpack[keyBlacklist[key]];
                }

                if (keyBlacklist[key] in databaseServer.getTables().bots.types[botType].inventory.items.TacticalVest)
                {
                    delete databaseServer.getTables().bots.types[botType].inventory.items.TacticalVest[keyBlacklist[key]];
                }
            }

            // Remove from static loot tables
            try
            {
                for (let entry in databaseServer.getTables().loot.staticLoot)
                {
                    databaseServer.getTables().loot.staticLoot[entry].itemDistribution[keyBlacklist[key]].relativeProbability = 0;
                }
            }
            catch
            {
                // Not found in the static loot tables
                //logger.warning(`${keyBlacklist[key]} was not found in static loot`)
            }

            // Global item blacklist
            itemConfig.blacklist.push(keyBlacklist[key]);
        }
    }
}

module.exports = { mod: new KeyBlacklist() };