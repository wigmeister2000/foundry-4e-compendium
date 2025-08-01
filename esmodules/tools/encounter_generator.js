import { DnD4ECompendium } from "../dnd-4e-compendium.js";
import { lookup } from "./lookup_tables.js";
import { escapeRegExp, capitalize, union, randomChoice, dropFirst, dropAll, countOccurences } from "./utility.js";
import { monsterIndex } from "./monster_index.js";
import { trapIndex } from "./trap_index.js";

export function fetchRandomMonster(level, role, legacy, index = monsterIndex) {
    let filtered = index.filter(x => x.level === level && x.legacy === legacy);

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

export function fetchRandomMonsters(specs, index = monsterIndex) {
    const monsters = [];

    for (const spec of specs) {
        if (!spec.batch) {
            for (let i = 0; i < spec.count; i++) {
                const monster = fetchRandomMonster(spec.level, spec.role, spec.legacy, index);
                if (Object.keys(monster).length > 0) {
                    monsters.push(monster);
                }
            }
        } else {
            const monster = fetchRandomMonster(spec.level, spec.role, spec.legacy, index);
            if (Object.keys(monster).length > 0) {
                for (let i = 0; i < spec.count; i++) {
                    monsters.push(monster);
                }
            }
        }
    }

    return monsters;
}

export function encounterBattlefieldControl(pcLevel, difficulty, legacy, batch = true) {
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
            batch: batch,
            legacy: legacy
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
            batch: batch,
            legacy: legacy
        });

    } else if (difficulty === "standard") {
        // Controller
        encounterSpecs.push({
            role: {
                primary: "controller",
                secondary: "standard",
                leader: "any"
            },
            level: pcLevel + 1,
            count: 1,
            batch: batch,
            legacy: legacy
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
            batch: batch,
            legacy: legacy
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
            batch: batch,
            legacy: legacy
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
            batch: batch,
            legacy: legacy
        });
    }

    const encounter = fetchRandomMonsters(encounterSpecs);

    return encounter;
}

export function encounterCommanderAndTroops(pcLevel, difficulty, legacy, batch = true) {
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
            batch: batch,
            legacy: legacy
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
            batch: batch,
            legacy: legacy
        });

    } else if (difficulty === "standard") {
        // Commander
        encounterSpecs.push({
            role: {
                primary: randomChoice(["controller", "soldier"]),
                secondary: "standard",
                leader: false
            },
            level: pcLevel + 3,
            count: 1,
            batch: batch,
            legacy: legacy
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
            batch: batch,
            legacy: legacy
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
            batch: batch,
            legacy: legacy
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
            batch: batch,
            legacy: legacy
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
            batch: batch,
            legacy: legacy
        });

    }

    const encounter = fetchRandomMonsters(encounterSpecs);

    return encounter;
}

export function encounterDragonsDen(pcLevel, difficulty, legacy, batch = true) {
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
            batch: batch,
            legacy: legacy
        });

    } else if (difficulty === "standard") {
        // Solo
        encounterSpecs.push({
            role: {
                primary: "any",
                secondary: "solo",
                leader: "any"
            },
            level: randomChoice([pcLevel, pcLevel + 1]),
            count: 1,
            batch: batch,
            legacy: legacy
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
                    batch: batch,
                    legacy: legacy
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
                    batch: batch,
                    legacy: legacy
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
                    batch: batch,
                    legacy: legacy
                });
                break;
            }
        }

    }

    const encounter = fetchRandomMonsters(encounterSpecs);

    return encounter;
}

export function encounterDoubleLine(pcLevel, difficulty, legacy, batch = true) {
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
            batch: batch,
            legacy: legacy
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
            batch: batch,
            legacy: legacy
        });

    } else if (difficulty === "standard") {
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
                    batch: batch,
                    legacy: legacy
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
                    batch: batch,
                    legacy: legacy
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
                    batch: batch,
                    legacy: legacy
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
                    batch: batch,
                    legacy: legacy
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
                    batch: batch,
                    legacy: legacy
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
                    batch: batch,
                    legacy: legacy
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
                    batch: batch,
                    legacy: legacy
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
                    batch: batch,
                    legacy: legacy
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
                    batch: batch,
                    legacy: legacy
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
                    batch: batch,
                    legacy: legacy
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
                    batch: batch,
                    legacy: legacy
                });

                break;
            }
        }
    }

    const encounter = fetchRandomMonsters(encounterSpecs);

    return encounter;
}

export function encounterWolfPack(pcLevel, difficulty, legacy, batch = true) {
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
            batch: batch,
            legacy: legacy
        });

    } else if (difficulty === "standard") {
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
                    batch: batch,
                    legacy: legacy
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
                    batch: batch,
                    legacy: legacy
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
                    batch: batch,
                    legacy: legacy
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
                    batch: batch,
                    legacy: legacy
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
                    batch: batch,
                    legacy: legacy
                });

                break;
            }
        }
    }

    const encounter = fetchRandomMonsters(encounterSpecs);

    return encounter;
}

export function substituteMinions(monsters, pcLevel) {
    const tier = Math.ceil(pcLevel / 10);
    const counts = countOccurences(monsters.map(x => x.name));
    const filtered = monsters.filter(x => x.role.secondary === "standard" && !x.role.leader && counts[x.name] > 2 + tier);
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
            batch: true,
            legacy: target.legacy
        }];

        const modifiedMonsters = [];
        let dropped = 0;

        for (const monster of monsters) {
            if (dropped < 3 + tier && monster.name === target.name) {
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

export function substituteElite(monsters, pcLevel) {
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
            batch: true,
            legacy: target.legacy
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

export function substituteSolo(monsters, pcLevel) {
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
            batch: true,
            legacy: target.legacy
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

export function substituteTrap(monsters, pcLevel) {
    const counts = countOccurences(monsters.map(x => x.name));
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
            batch: true,
            legacy: false
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

        const substitute = fetchRandomMonsters(substituteSpecs, trapIndex);

        if (substitute.length > 0) {
            return modifiedMonsters.concat(substitute);
        } else {
            return monsters;
        }
    } else {
        return monsters;
    }
}