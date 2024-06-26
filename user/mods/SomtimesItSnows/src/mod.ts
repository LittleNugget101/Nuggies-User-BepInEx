/* eslint-disable @typescript-eslint/naming-convention */
import { DependencyContainer } from "tsyringe";
import { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import { enable, winterChance } from "../config/config.json";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";
import { IWeatherConfig } from "@spt-aki/models/spt/config/IWeatherConfig";
import { StaticRouterModService } from "@spt-aki/services/mod/staticRouter/StaticRouterModService";

class SomtimesItSnows implements IPreAkiLoadMod {
  preAkiLoad(container: DependencyContainer): void {
    const configServer = container.resolve<ConfigServer>("ConfigServer");
    const WeatherValues = configServer.getConfig<IWeatherConfig>(
      ConfigTypes.WEATHER
    );

    const staticRouterModService = container.resolve<StaticRouterModService>(
      "StaticRouterModService"
    );

    enable &&
      staticRouterModService.registerStaticRouter(
        `SomtimesItSnows`,
        [
          {
            url: "/client/raid/configuration",
            action: (_url, info, sessionId, output) => {
              WeatherValues.forceWinterEvent = false;
              if (Math.random() < winterChance) {
                WeatherValues.forceWinterEvent = true;
              }

              return output;
            },
          },
        ],
        "aki"
      );
  }
}

module.exports = { mod: new SomtimesItSnows() };
