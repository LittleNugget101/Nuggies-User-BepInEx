# UselessKeyBlacklist v1.2.1
Author: RaiRaiTheRaichu

### ---BUILT FOR AKI VERSION 3.8.0---

This mod filters out all the keys to doors that are already open (particularly several of the Resort keys on Shoreline) so you never accidentally take a key you don't need!

No configuration available, just a small script I wanted to release that I use for my own personal play.

Features:
- Red background on keys that lead to already-open doors.
- Useless keys have a small notice at the top of its description.
- Useless keys are removed from AI loot pools (other mods may overwrite this, sorry).
- Useless keys are removed from static loot spawns.
- Useless keys are no longer sold on Fence or the Flea Market.

If you have any suggestions for the script, let me know, but it's pretty simple and straightforward. You can freely edit the /src/mod.ts if you really would like to change anything.


## ---INSTALL INFO---

How to install:
Copy this folder: `RaiRaiTheRaichu-UselessKeyBlacklist-1.2.1` into your user/mods/ folder.

If you're updating from an older version, please be sure to delete the old mod from your folder.


## ---CHANGELOGS---

#### v1.1.0 Changelog: 
- Major refactor to localization to comply with new standards as of client version 20765.
- Added more methods to reduce the amount of blacklisted keys that appear.
- Minor change to the version in the package.json, compatible with version 3.4.0 of AKI.

#### v1.1.1 Changelog: 
- Minor change to the version in the package.json, compatible with version 3.5.0 of AKI.

#### v1.1.2 Changelog: 
- Fixed an issue with the PMC loot blacklist causing an issue during the server loading.
- Minor change to the version in the package.json, compatible with version 3.5.2 of AKI.

#### v1.2.0 Changelog:
- Minor change to the version in the package.json, compatible with version 3.8.0+ of AKI.
- Removed the barter key tweaks. This used a harcoded list which can change with mods and such, and other mods do this better (More Checkmarks is a direct improvement to this).
- Updated the blacklist to include all unused keys as of SPT-AKI 3.8.0.
- Slight refactor to the blacklist algorithm - should apply to all types of AI and work more reliably in general.

### v1.2.1 Changelog:
- Hotfix for the infinite loading on raid.


## ---CONTACT---

@RaiRaiTheRaichu - Discord
user/6798-rairaitheraichu - on sp-tarkov.com 


## ---LICENSE---

Copyright 2022-2024 - RaiRaiTheRaichu

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.