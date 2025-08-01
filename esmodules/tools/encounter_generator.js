import { DnD4ECompendium } from "../dnd-4e-compendium.js";
import { lookup } from "./lookup_tables.js";
import { escapeRegExp, capitalize, union, randomChoice } from "./utility.js";
import { monsterIndex } from "./monster_index.js";

export function fetchRandomMonster(level, role, legacy) {
    let filtered = monsterIndex.filter(x => x.level === level && x.legacy === legacy);

    if (role != {}) {
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

    return filtered.length > 0 ? randomChoice(filtered) : [];
}

export function fetchRandomMonsters(specs) {
    const monsters = [];

    for (const spec of specs) {
        if (!spec.batch) {
            for (let i = 0; i < spec.count; i++) {
                monsters.push(fetchRandomMonster(spec.level, spec.role, spec.legacy));
            }
        } else {
            const monster = fetchRandomMonster(spec.level, spec.role, spec.legacy);
            for (let i = 0; i < spec.count; i++) {
                monsters.push(monster);
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