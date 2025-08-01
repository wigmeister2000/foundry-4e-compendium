import { DnD4ECompendium } from "../dnd-4e-compendium.js";
import { lookup } from "./lookup_tables.js";
import { escapeRegExp, capitalize, union, randomChoice } from "./utility.js";
import { monsterIndex } from "./monster_index.js";

export function fetchRandomMonster(level, role, legacy) {
    let filtered = monsterIndex.filter(x => x.level === level && x.legacy === legacy);

    if (role != {}) {
        filtered = filtered.filter(x => x.role.primary === role.primary && x.role.secondary === role.secondary && x.role.leader === role.leader);
    }

    return filtered.length > 0 ? randomChoice(filtered) : [];
}

export function fetchRandomMonsters(specs){
    const monsters = [];
    
    for (const spec of specs){
        if (!spec.batch){
            for (let i = 0; i < spec.count; i++){
                monsters.push(fetchRandomMonster(spec.level, spec.role, spec.legacy));
            }
        } else {
            const monster = fetchRandomMonster(spec.level, spec.role, spec.legacy);
            for (let i = 0; i < spec.count; i++){
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
                leader: false
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
                leader: false
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
                leader: false
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