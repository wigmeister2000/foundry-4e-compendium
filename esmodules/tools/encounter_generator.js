import { DnD4ECompendium } from "../dnd-4e-compendium.js";
import { randomChoice, countOccurences, capitalize, identity, range, union } from "./utility.js";
import { monsterIndex } from "./monster_index.js";
import { trapIndex } from "./trap_index.js";
import { createPrivateMessage } from "./utility.js";

/***********************************************************************/
/* Buttons */

export function addRandomEncounterButton(activeTab, html) {
    if (game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.RANDOM_ENCOUNTER)) {
        // Show the button only for users with actor creation rights
        if (activeTab.options.classes[2] === "actors-sidebar" && game.user.hasPermission("ACTOR_CREATE")) {

            const label = game.i18n.localize("4ECOMPENDIUM.buttons.random-encounter-button");
            const button = $(`<div class="action-buttons flexrow cbimport"><button type='button' id="random-encounter-button" title=' ${label}'><i class="fas fa-random"></i>&nbsp;${label}</button></div>`);

            // Find the header button element and add
            const topBar = html.find(`[class="header-actions action-buttons flexrow"]`);
            topBar.after(button);

            html.on('click', '#random-encounter-button', (event) => {
                randomEncounterDialog();
            });
        }
    }
}

/***********************************************************************/
/* Dialogs */

async function randomEncounterDialog() {
    new Dialog({
        title: game.i18n.localize("4ECOMPENDIUM.random-encounter.title"),
        content: await renderTemplate("modules/" + DnD4ECompendium.ID + "/templates/random-encounter.hbs", {
            hint1: game.i18n.format("4ECOMPENDIUM.random-encounter.hint1"),
            levels: range(1, 30),
            templates: [
                { id: "Random", name: "Random" },
                { id: "Battlefield Control", name: "Battlefield Control" },
                { id: "Double Line", name: "Double Line" },
                { id: "Dragon's Den", name: "Dragon's Den" },
                { id: "Wolf Pack", name: "Wolf Pack" }
            ],
            substitutions: [
                { id: "none", name: "None" },
                { id: "random", name: "Random" },
                { id: "minion", name: "Standard -> Minions" },
                { id: "elite", name: "Standard -> Elite" },
                { id: "trap", name: "Standard -> Trap" }
            ],
            extras: [
                { id: "none", name: "None" },
                { id: "random", name: "Random" },
                { id: "substituteTrap", name: "Standard -> Trap" },
                { id: "substituteHazard", name: "Standard -> Hazard" },
                { id: "substituteLurker", name: "Standard -> Lurker" },
                { id: "addTrap", name: "Add trap" },
                { id: "addHazard", name: "Add hazard" },
                { id: "addLurker", name: "Add lurker" }
            ],
            difficulties: [
                { id: "easy", name: "Easy" },
                { id: "moderate", name: "Moderate" },
                { id: "hard", name: "Hard" }
            ],
            defaultDifficulty: "moderate"
        }),
        buttons: {
            generate: {
                icon: '<i class="fas fa-random"></i>',
                label: "Generate",
                callback: html => {
                    const form = html.find("form")[0];
                    const name = html.find("input[name='encounterName']").val();
                    const template = html.find("select[name='template']").val();
                    const substitution = html.find("select[name='substitution']").val();
                    const extra = html.find("select[name='extra']").val();
                    const pcLevel = Number(html.find("select[name='pcLevel']").val());
                    const difficulty = html.find("select[name='difficulty']").val();
                    const includeLegacy = html.find("input[name='includeLegacy']")[0].checked;
                    const randomizeGroups = html.find("input[name='randomizeGroups']")[0].checked;
                    const createFolder = html.find("input[name='createFolder']")[0].checked;
                    generateRandomEncounter(name, template, substitution, extra, pcLevel, difficulty, includeLegacy, randomizeGroups, createFolder);
                }
            },
            no: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel"
            }
        },
        default: "generate"
    }, {
        width: 400
    }).render(true);
}

/***********************************************************************/
/* Encounter generation */

async function generateRandomEncounter(name, type, substitution, extraFeature, pcLevel, difficulty, includeLegacy, randomizeGroups, createFolder) {
    let encounter = randomEncounterFunction(type)(pcLevel, difficulty, includeLegacy, randomizeGroups);
    encounter = substituteEncounterFunction(substitution)(encounter, pcLevel, includeLegacy);
    encounter = extraFeatureFunction(extraFeature)(encounter, pcLevel, includeLegacy);

    makeEncounterMessage(encounter, pcLevel, difficulty);

    if (createFolder) {
        const compendiumMM3 = game.packs.get(DnD4ECompendium.ID + ".module-monsters-mm3");
        const compendiumLegacy = game.packs.get(DnD4ECompendium.ID + ".module-monsters-legacy");
        const compendiumTraps = game.packs.get(DnD4ECompendium.ID + ".module-traps");


        const mm3 = [];
        const legacy = [];
        const traps = [];

        for (const monster of union(encounter)) {
            if (Object.hasOwn(monster, "hazard")) {
                traps.push(monster);
            } else if (monster.legacy) {
                legacy.push(monster);
            } else {
                mm3.push(monster);
            }
        }

        const mm3Documents = await compendiumMM3.getDocuments({ _id__in: mm3.map(x => x._id) });
        const legacyDocuments = await compendiumLegacy.getDocuments({ _id__in: legacy.map(x => x._id) });
        const trapsDocuments = await compendiumTraps.getDocuments({ _id__in: traps.map(x => x._id) });

        const folder = await Folder.create({ name: name, type: "Actor" });
        const data = [...mm3Documents, ...legacyDocuments, ...trapsDocuments].map(actor => game.actors.fromCompendium(actor));
        data.forEach(actor => actor.folder = folder.id);

        Actor.createDocuments(data);
    }
}

function randomEncounterFunction(type) {
    switch (type) {
        case "Random": return randomChoice([encounterBattlefieldControl, encounterCommanderAndTroops, encounterDoubleLine, encounterDragonsDen, encounterWolfPack]);
        case "Battlefield Control": return encounterBattlefieldControl;
        case "Commander and Troops": return encounterCommanderAndTroops;
        case "Double Line": return encounterDoubleLine;
        case "Dragon's Den": return encounterDragonsDen;
        case "Wolf Pack": return encounterWolfPack;
    }
}

function substituteEncounterFunction(substitution) {
    switch (substitution) {
        case "none": return identity;
        case "random": return randomChoice([identity, substituteMinions, substituteElite, substituteTrap]);
        case "minion": return substituteMinions;
        case "elite": return substituteElite;
        case "trap": return substituteTrap;
    }
}

function extraFeatureFunction(extraFeature) {
    switch (extraFeature) {
        case "none": return identity;
        case "random": return randomChoice([
            identity,
            encounterExtraSubstituteTrap,
            encounterExtraSubstituteHazard,
            encounterExtraSubstituteLurker,
            encounterExtraAddTrap,
            encounterExtraAddHazard,
            encounterExtraAddLurker
        ]);
        case "substituteTrap": return encounterExtraSubstituteTrap;
        case "substituteHazard": return encounterExtraSubstituteHazard;
        case "substituteLurker": return encounterExtraSubstituteLurker;
        case "addTrap": return encounterExtraAddTrap;
        case "addHazard": return encounterExtraAddHazard;
        case "addLurker": return encounterExtraAddLurker;
    }
}

async function makeEncounterMessage(encounter, pcLevel, difficulty) {
    const counts = countOccurences(encounter.map(x => x.name));
    const byName = {};

    for (const monster of encounter) {
        if (!byName[monster.name]) {
            byName[monster.name] = monster;
        }
    }

    const lines = [
        "<strong>" + capitalize(difficulty) + " encounter for five level " + pcLevel + " characters</strong>"
    ];

    for (const key in counts) {
        lines.push(counts[key] + " " + key);
    }

    return createPrivateMessage(lines.join("<br>"));
}

function fetchRandomMonster(level, role, includeLegacy = false, index = monsterIndex, filterFunction = identity) {
    let filtered = includeLegacy ? index.filter(x => x.level === level) : index.filter(x => x.level === level && x.legacy === false);
    filtered = filterFunction(filtered);

    if (Object.keys(role).length > 0) {
        if (role.primary != "any") {
            filtered = filtered.filter(x => x.role.primary === role.primary);
        }

        if (role.secondary != "any") {
            filtered = filtered.filter(x => x.role.secondary === role.secondary);
        }

        if (role.leader != "any") {
            filtered = filtered.filter(x => x.role.leader === role.leader);
        }
    }

    return filtered.length > 0 ? randomChoice(filtered) : {};
}

function fetchRandomMonsters(specs, index = monsterIndex, filterFunction = identity) {
    const monsters = [];

    for (const spec of specs) {
        if (spec.randomizeGroups) {
            for (let i = 0; i < spec.count; i++) {
                const monster = fetchRandomMonster(Math.max(1, spec.level), spec.role, spec.includeLegacy, index, filterFunction);
                if (Object.keys(monster).length > 0) {
                    monsters.push(monster);
                }
            }
        } else {
            const monster = fetchRandomMonster(Math.max(1, spec.level), spec.role, spec.includeLegacy, index, filterFunction);
            if (Object.keys(monster).length > 0) {
                for (let i = 0; i < spec.count; i++) {
                    monsters.push(monster);
                }
            }
        }
    }

    return monsters;
}

function encounterBattlefieldControl(pcLevel, difficulty, includeLegacy = false, randomizeGroups = false) {
    const encounterSpecs = [];

    if (difficulty === "easy") {
        // Controller
        encounterSpecs.push({
            role: {
                primary: "controller",
                secondary: "standard",
                leader: "any"
            },
            level: pcLevel - 2,
            count: 1,
            randomizeGroups: randomizeGroups,
            includeLegacy: includeLegacy
        });

        // Skirmishers
        encounterSpecs.push({
            role: {
                primary: "skirmisher",
                secondary: "standard",
                leader: false
            },
            level: pcLevel - 4,
            count: 6,
            randomizeGroups: randomizeGroups,
            includeLegacy: includeLegacy
        });

    } else if (difficulty === "moderate") {
        // Controller
        encounterSpecs.push({
            role: {
                primary: "controller",
                secondary: "standard",
                leader: "any"
            },
            level: pcLevel + 1,
            count: 1,
            randomizeGroups: randomizeGroups,
            includeLegacy: includeLegacy
        });

        // Skirmishers
        encounterSpecs.push({
            role: {
                primary: "skirmisher",
                secondary: "standard",
                leader: false
            },
            level: pcLevel - 2,
            count: 6,
            randomizeGroups: randomizeGroups,
            includeLegacy: includeLegacy
        });

    } else if (difficulty === "hard") {
        // Controller
        encounterSpecs.push({
            role: {
                primary: "controller",
                secondary: "standard",
                leader: "any"
            },
            level: pcLevel + 5,
            count: 1,
            randomizeGroups: randomizeGroups,
            includeLegacy: includeLegacy
        });

        // Skirmishers
        encounterSpecs.push({
            role: {
                primary: "skirmisher",
                secondary: "standard",
                leader: false
            },
            level: pcLevel + 1,
            count: 5,
            randomizeGroups: randomizeGroups,
            includeLegacy: includeLegacy
        });
    }

    const encounter = fetchRandomMonsters(encounterSpecs);

    return encounter;
}

function encounterCommanderAndTroops(pcLevel, difficulty, includeLegacy = false, randomizeGroups = false) {
    const encounterSpecs = [];

    if (difficulty === "easy") {
        // Commander
        encounterSpecs.push({
            role: {
                primary: randomChoice(["controller", "soldier"]),
                secondary: "standard",
                leader: "any"
            },
            level: pcLevel,
            count: 1,
            randomizeGroups: randomizeGroups,
            includeLegacy: includeLegacy
        });

        // Troops
        encounterSpecs.push({
            role: {
                primary: randomChoice(["brute", "soldier"]),
                secondary: "standard",
                leader: false
            },
            level: pcLevel - 3,
            count: 4,
            randomizeGroups: randomizeGroups,
            includeLegacy: includeLegacy
        });

    } else if (difficulty === "moderate") {
        // Commander
        encounterSpecs.push({
            role: {
                primary: randomChoice(["controller", "soldier"]),
                secondary: "standard",
                leader: false
            },
            level: pcLevel + 3,
            count: 1,
            randomizeGroups: randomizeGroups,
            includeLegacy: includeLegacy
        });

        // Troops
        encounterSpecs.push({
            role: {
                primary: randomChoice(["brute", "soldier"]),
                secondary: "standard",
                leader: false
            },
            level: pcLevel - 2,
            count: 5,
            randomizeGroups: randomizeGroups,
            includeLegacy: includeLegacy
        });

    } else if (difficulty === "hard") {
        // Commander
        encounterSpecs.push({
            role: {
                primary: randomChoice(["controller", "soldier"]),
                secondary: "standard",
                leader: false
            },
            level: pcLevel + 6,
            count: 1,
            randomizeGroups: randomizeGroups,
            includeLegacy: includeLegacy
        });

        // Troops
        encounterSpecs.push({
            role: {
                primary: randomChoice(["brute", "soldier"]),
                secondary: "standard",
                leader: false
            },
            level: pcLevel + 1,
            count: 3,
            randomizeGroups: randomizeGroups,
            includeLegacy: includeLegacy
        });

        // Artillery
        encounterSpecs.push({
            role: {
                primary: "artillery",
                secondary: "standard",
                leader: false
            },
            level: pcLevel + 1,
            count: 2,
            randomizeGroups: randomizeGroups,
            includeLegacy: includeLegacy
        });

    }

    const encounter = fetchRandomMonsters(encounterSpecs);

    return encounter;
}

function encounterDragonsDen(pcLevel, difficulty, includeLegacy = false, randomizeGroups = false) {
    const encounterSpecs = [];

    if (difficulty === "easy") {
        // Solo
        encounterSpecs.push({
            role: {
                primary: "any",
                secondary: "solo",
                leader: "any"
            },
            level: pcLevel - 2,
            count: 1,
            randomizeGroups: randomizeGroups,
            includeLegacy: includeLegacy
        });

    } else if (difficulty === "moderate") {
        // Solo
        encounterSpecs.push({
            role: {
                primary: "any",
                secondary: "solo",
                leader: "any"
            },
            level: randomChoice([pcLevel, pcLevel + 1]),
            count: 1,
            randomizeGroups: randomizeGroups,
            includeLegacy: includeLegacy
        });

    } else if (difficulty === "hard") {
        const variant = randomChoice([1, 2]);

        switch (variant) {
            case 1: {
                // Solo
                encounterSpecs.push({
                    role: {
                        primary: "any",
                        secondary: "solo",
                        leader: "any"
                    },
                    level: pcLevel + 3,
                    count: 1,
                    randomizeGroups: randomizeGroups,
                    includeLegacy: includeLegacy
                });
                break;
            }
            case 2: {
                // Solo
                encounterSpecs.push({
                    role: {
                        primary: "any",
                        secondary: "solo",
                        leader: "any"
                    },
                    level: pcLevel + 1,
                    count: 1,
                    randomizeGroups: randomizeGroups,
                    includeLegacy: includeLegacy
                });

                // Elite
                encounterSpecs.push({
                    role: {
                        primary: "any",
                        secondary: "elite",
                        leader: false
                    },
                    level: pcLevel,
                    count: 1,
                    randomizeGroups: randomizeGroups,
                    includeLegacy: includeLegacy
                });
                break;
            }
        }

    }

    const encounter = fetchRandomMonsters(encounterSpecs);

    return encounter;
}

function encounterDoubleLine(pcLevel, difficulty, includeLegacy = false, randomizeGroups = false) {
    const encounterSpecs = [];

    if (difficulty === "easy") {
        // Front line
        encounterSpecs.push({
            role: {
                primary: randomChoice(["brute", "soldier"]),
                secondary: "standard",
                leader: false
            },
            level: pcLevel - 4,
            count: 3,
            randomizeGroups: randomizeGroups,
            includeLegacy: includeLegacy
        });

        // Rear line
        encounterSpecs.push({
            role: {
                primary: randomChoice(["controller", "artillery"]),
                secondary: "standard",
                leader: false
            },
            level: pcLevel - 2,
            count: 2,
            randomizeGroups: randomizeGroups,
            includeLegacy: includeLegacy
        });

    } else if (difficulty === "moderate") {
        const variant = randomChoice([1, 2]);

        switch (variant) {
            case 1: {
                // Front line
                encounterSpecs.push({
                    role: {
                        primary: randomChoice(["brute", "soldier"]),
                        secondary: "standard",
                        leader: false
                    },
                    level: pcLevel,
                    count: 3,
                    randomizeGroups: randomizeGroups,
                    includeLegacy: includeLegacy
                });

                // Rear line
                encounterSpecs.push({
                    role: {
                        primary: randomChoice(["controller", "artillery"]),
                        secondary: "standard",
                        leader: false
                    },
                    level: pcLevel,
                    count: 2,
                    randomizeGroups: randomizeGroups,
                    includeLegacy: includeLegacy
                });

                break;
            }
            case 2: {
                // Front line
                encounterSpecs.push({
                    role: {
                        primary: randomChoice(["brute", "soldier"]),
                        secondary: "standard",
                        leader: false
                    },
                    level: pcLevel - 2,
                    count: 3,
                    randomizeGroups: randomizeGroups,
                    includeLegacy: includeLegacy
                });

                // Rear line
                encounterSpecs.push({
                    role: {
                        primary: randomChoice(["controller", "artillery"]),
                        secondary: "standard",
                        leader: false
                    },
                    level: pcLevel + 3,
                    count: 2,
                    randomizeGroups: randomizeGroups,
                    includeLegacy: includeLegacy
                });

                break;
            }
        }

    } else if (difficulty === "hard") {
        const variant = randomChoice([1, 2]);

        switch (variant) {
            case 1: {
                // Front line
                encounterSpecs.push({
                    role: {
                        primary: randomChoice(["brute", "soldier"]),
                        secondary: "standard",
                        leader: false
                    },
                    level: pcLevel + 2,
                    count: 3,
                    randomizeGroups: randomizeGroups,
                    includeLegacy: includeLegacy
                });

                // Controller
                encounterSpecs.push({
                    role: {
                        primary: "controller",
                        secondary: "standard",
                        leader: "any"
                    },
                    level: pcLevel + 4,
                    count: 1,
                    randomizeGroups: randomizeGroups,
                    includeLegacy: includeLegacy
                });

                // Artillery / Lurker
                encounterSpecs.push({
                    role: {
                        primary: randomChoice(["artillery", "lurker"]),
                        secondary: "standard",
                        leader: false
                    },
                    level: pcLevel + 4,
                    count: 1,
                    randomizeGroups: randomizeGroups,
                    includeLegacy: includeLegacy
                });

                break;
            }
            case 2: {
                // Front line
                encounterSpecs.push({
                    role: {
                        primary: randomChoice(["brute", "soldier"]),
                        secondary: "standard",
                        leader: false
                    },
                    level: pcLevel,
                    count: 3,
                    randomizeGroups: randomizeGroups,
                    includeLegacy: includeLegacy
                });

                // Artillery
                encounterSpecs.push({
                    role: {
                        primary: "artillery",
                        secondary: "standard",
                        leader: false
                    },
                    level: pcLevel + 1,
                    count: 2,
                    randomizeGroups: randomizeGroups,
                    includeLegacy: includeLegacy
                });

                // Controller
                encounterSpecs.push({
                    role: {
                        primary: "controller",
                        secondary: "standard",
                        leader: "any"
                    },
                    level: pcLevel + 2,
                    count: 1,
                    randomizeGroups: randomizeGroups,
                    includeLegacy: includeLegacy
                });

                // Lurker
                encounterSpecs.push({
                    role: {
                        primary: "lurker",
                        secondary: "standard",
                        leader: false
                    },
                    level: pcLevel + 2,
                    count: 1,
                    randomizeGroups: randomizeGroups,
                    includeLegacy: includeLegacy
                });

                break;
            }
        }
    }

    const encounter = fetchRandomMonsters(encounterSpecs);

    return encounter;
}

function encounterWolfPack(pcLevel, difficulty, includeLegacy = false, randomizeGroups = false) {
    const encounterSpecs = [];

    if (difficulty === "easy") {
        // Skirmishers
        encounterSpecs.push({
            role: {
                primary: "skirmisher",
                secondary: "standard",
                leader: false
            },
            level: pcLevel - 4,
            count: 7,
            randomizeGroups: randomizeGroups,
            includeLegacy: includeLegacy
        });

    } else if (difficulty === "moderate") {
        const variant = randomChoice([1, 2]);

        switch (variant) {
            case 1: {
                // Skirmishers
                encounterSpecs.push({
                    role: {
                        primary: "skirmisher",
                        secondary: "standard",
                        leader: false
                    },
                    level: pcLevel - 2,
                    count: 7,
                    randomizeGroups: randomizeGroups,
                    includeLegacy: includeLegacy
                });

                break;
            }
            case 2: {
                // Skirmishers
                encounterSpecs.push({
                    role: {
                        primary: "skirmisher",
                        secondary: "standard",
                        leader: false
                    },
                    level: pcLevel,
                    count: 5,
                    randomizeGroups: randomizeGroups,
                    includeLegacy: includeLegacy
                });

                break;
            }
        }

    } else if (difficulty === "hard") {
        const variant = randomChoice([1, 2, 3]);

        switch (variant) {
            case 1: {
                // Skirmishers
                encounterSpecs.push({
                    role: {
                        primary: "skirmisher",
                        secondary: "standard",
                        leader: false
                    },
                    level: pcLevel + 7,
                    count: 3,
                    randomizeGroups: randomizeGroups,
                    includeLegacy: includeLegacy
                });

                break;
            }
            case 2: {
                // Skirmishers
                encounterSpecs.push({
                    role: {
                        primary: "skirmisher",
                        secondary: "standard",
                        leader: false
                    },
                    level: pcLevel + 5,
                    count: 4,
                    randomizeGroups: randomizeGroups,
                    includeLegacy: includeLegacy
                });

                break;
            }
            case 3: {
                // Skirmishers
                encounterSpecs.push({
                    role: {
                        primary: "skirmisher",
                        secondary: "standard",
                        leader: false
                    },
                    level: pcLevel + 2,
                    count: 6,
                    randomizeGroups: randomizeGroups,
                    includeLegacy: includeLegacy
                });

                break;
            }
        }
    }

    const encounter = fetchRandomMonsters(encounterSpecs);

    return encounter;
}

function substituteMinions(monsters, pcLevel, includeLegacy = false) {
    const tier = Math.ceil(pcLevel / 10);
    const filtered = monsters.filter(x => x.role.secondary === "standard" && !x.role.leader);
    const target = filtered.length > 0 ? randomChoice(filtered) : {};

    if (Object.keys(target).length > 0) {

        const substituteSpecs = [{
            role: {
                primary: target.legacy ? "any" : target.role.primary, // Account for legacy minions not having a primary role
                secondary: "minion",
                leader: target.role.leader
            },
            level: target.level,
            count: 3 + tier,
            randomizeGroups: false,
            includeLegacy: includeLegacy
        }];

        const modifiedMonsters = [];
        let dropped = 0;

        for (const monster of monsters) {
            if (dropped < 1 && monster.name === target.name) {
                dropped++
            } else {
                modifiedMonsters.push(monster);
            }
        }

        const substitute = fetchRandomMonsters(substituteSpecs);

        if (substitute.length > 0) {
            return modifiedMonsters.concat(substitute);
        } else {
            return monsters;
        }
    } else {
        return monsters;
    }
}

function substituteElite(monsters, pcLevel, includeLegacy = false) {
    const counts = countOccurences(monsters.map(x => x.name));
    const filtered = monsters.filter(x => x.role.secondary === "standard" && !x.role.leader && counts[x.name] > 1);
    const target = filtered.length > 0 ? randomChoice(filtered) : {};

    if (Object.keys(target).length > 0) {

        const substituteSpecs = [{
            role: {
                primary: target.role.primary,
                secondary: "elite",
                leader: target.role.leader
            },
            level: target.level,
            count: 1,
            randomizeGroups: true,
            includeLegacy: includeLegacy
        }];

        const modifiedMonsters = [];
        let dropped = 0;

        for (const monster of monsters) {
            if (dropped < 2 && monster.name === target.name) {
                dropped++
            } else {
                modifiedMonsters.push(monster);
            }
        }

        const substitute = fetchRandomMonsters(substituteSpecs);

        if (substitute.length > 0) {
            return modifiedMonsters.concat(substitute);
        } else {
            return monsters;
        }
    } else {
        return monsters;
    }
}

function substituteSolo(monsters, pcLevel, includeLegacy = false) {
    const counts = countOccurences(monsters.map(x => x.name));
    const filtered = monsters.filter(x => x.role.secondary === "standard" && !x.role.leader && counts[x.name] > 4);
    const target = filtered.length > 0 ? randomChoice(filtered) : {};

    if (Object.keys(target).length > 0) {

        const substituteSpecs = [{
            role: {
                primary: target.role.primary,
                secondary: "solo",
                leader: target.role.leader
            },
            level: target.level,
            count: 1,
            randomizeGroups: true,
            includeLegacy: includeLegacy
        }];

        const modifiedMonsters = [];
        let dropped = 0;

        for (const monster of monsters) {
            if (dropped < 5 && monster.name === target.name) {
                dropped++
            } else {
                modifiedMonsters.push(monster);
            }
        }

        const substitute = fetchRandomMonsters(substituteSpecs);

        if (substitute.length > 0) {
            return modifiedMonsters.concat(substitute);
        } else {
            return monsters;
        }
    } else {
        return monsters;
    }
}

function substituteTrap(monsters, pcLevel, includeLegacy = false, filterFunction = identity) {
    const filtered = monsters.filter(x => x.role.secondary === "standard" && !x.role.leader);
    const target = filtered.length > 0 ? randomChoice(filtered) : {};

    if (Object.keys(target).length > 0) {

        const substituteSpecs = [{
            role: {
                primary: "any",
                secondary: target.role.secondary,
                leader: false
            },
            level: target.level,
            count: 1,
            randomizeGroups: true,
            includeLegacy: includeLegacy
        }];

        const modifiedMonsters = [];
        let dropped = 0;

        for (const monster of monsters) {
            if (dropped < 1 && monster.name === target.name) {
                dropped++
            } else {
                modifiedMonsters.push(monster);
            }
        }

        const substitute = fetchRandomMonsters(substituteSpecs, trapIndex, filterFunction);

        if (substitute.length > 0) {
            return modifiedMonsters.concat(substitute);
        } else {
            return monsters;
        }
    } else {
        return monsters;
    }
}

function filterTraps(monsters) {
    return monsters.filter(x => !x.hazard);
}

function filterHazards(monsters) {
    return monsters.filter(x => x.hazard);
}

function encounterExtraSubstituteTrap(monsters, pcLevel, includeLegacy = false) {
    return substituteTrap(monsters, pcLevel, filterTraps);
}

function encounterExtraSubstituteHazard(monsters, pcLevel, includeLegacy = false) {
    return substituteTrap(monsters, pcLevel, filterHazards);
}

function encounterExtraSubstituteLurker(monsters, pcLevel, includeLegacy = false) {
    const filtered = monsters.filter(x => x.role.secondary === "standard" && x.role.primary != "lurker" && !x.role.leader);
    const target = filtered.length > 0 ? filtered.sort((a, b) => a.level - b.level)[0] : {};

    if (Object.keys(target).length > 0) {

        const substituteSpecs = [{
            role: {
                primary: "lurker",
                secondary: target.role.secondary,
                leader: false
            },
            level: target.level,
            count: 1,
            randomizeGroups: true,
            includeLegacy: includeLegacy
        }];

        const modifiedMonsters = [];

        for (const monster of monsters) {
            modifiedMonsters.push(monster);
        }

        const substitute = fetchRandomMonsters(substituteSpecs, monsterIndex);

        if (substitute.length > 0) {
            return modifiedMonsters.concat(substitute);
        } else {
            return monsters;
        }
    } else {
        return monsters;
    }
}

function encounterExtraAddTrap(monsters, pcLevel, includeLegacy = false) {
    const filtered = monsters.filter(x => x.role.secondary === "standard" && !x.role.leader);
    const target = filtered.length > 0 ? filtered.sort((a, b) => a.level - b.level)[0] : {};

    if (Object.keys(target).length > 0) {

        const substituteSpecs = [{
            role: {
                primary: "any",
                secondary: target.role.secondary,
                leader: false
            },
            level: target.level,
            count: 1,
            randomizeGroups: true,
            includeLegacy: includeLegacy
        }];

        const modifiedMonsters = [];
        for (const monster of monsters) {
            modifiedMonsters.push(monster);
        }

        const substitute = fetchRandomMonsters(substituteSpecs, trapIndex, filterTraps);

        if (substitute.length > 0) {
            return modifiedMonsters.concat(substitute);
        } else {
            return monsters;
        }
    } else {
        return monsters;
    }
}

function encounterExtraAddHazard(monsters, pcLevel, includeLegacy = false) {
    const filtered = monsters.filter(x => x.role.secondary === "standard" && !x.role.leader);
    const target = filtered.length > 0 ? filtered.sort((a, b) => a.level - b.level)[0] : {};

    if (Object.keys(target).length > 0) {

        const substituteSpecs = [{
            role: {
                primary: "any",
                secondary: target.role.secondary,
                leader: false
            },
            level: target.level,
            count: 1,
            randomizeGroups: true,
            includeLegacy: includeLegacy
        }];

        const modifiedMonsters = [];
        for (const monster of monsters) {
            modifiedMonsters.push(monster);
        }

        const substitute = fetchRandomMonsters(substituteSpecs, trapIndex, filterHazards);

        if (substitute.length > 0) {
            return modifiedMonsters.concat(substitute);
        } else {
            return monsters;
        }
    } else {
        return monsters;
    }
}

function encounterExtraAddLurker(monsters, pcLevel, includeLegacy = false) {
    const filtered = monsters.filter(x => x.role.secondary === "standard" && !x.role.leader);
    const target = filtered.length > 0 ? filtered.sort((a, b) => a.level - b.level)[0] : {};

    if (Object.keys(target).length > 0) {

        const substituteSpecs = [{
            role: {
                primary: "lurker",
                secondary: target.role.secondary,
                leader: false
            },
            level: target.level,
            count: 1,
            randomizeGroups: true,
            includeLegacy: includeLegacy
        }];

        const modifiedMonsters = [];
        for (const monster of monsters) {
            modifiedMonsters.push(monster);
        }

        const substitute = fetchRandomMonsters(substituteSpecs, monsterIndex);

        if (substitute.length > 0) {
            return modifiedMonsters.concat(substitute);
        } else {
            return monsters;
        }
    } else {
        return monsters;
    }
}