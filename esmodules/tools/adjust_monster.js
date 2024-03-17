import { DnD4ECompendium } from "../dnd-4e-compendium.js";
import { lookup } from "./lookup_tables.js";
import { escapeRegExp, capitalize, union } from "./utility.js";

/***********************************************************************/
/* Context menu extensions */

export function addActorContextMenuAdjustMonster(html, entryOptions) {
    if (game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.MONSTER_ADJUSTMENT)) {
        entryOptions.push({
            name: game.i18n.localize("4ECOMPENDIUM.context.adjust-monster-level"),
            condition: target => {
                const id = target.attr("data-document-id");
                const actor = game.actors.get(id);
                return game.user.hasPermission("ACTOR_CREATE") && actor?.type === "NPC";
            },
            icon: '<i class="fas fa-adjust"></i>',
            callback: target => {
                const id = target.attr("data-document-id");
                const actor = game.actors.get(id);
                adjustActorDialog(actor);
            }
        })
    }
}

export function addActorContextMenuMM3Math(html, entryOptions) {
    if (game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.MONSTER_ADJUSTMENT)) {
        entryOptions.push({
            name: game.i18n.localize("4ECOMPENDIUM.context.mm3-math"),
            condition: target => {
                const id = target.attr("data-document-id")
                const actor = game.actors.get(id);
                return game.user.hasPermission("ACTOR_CREATE") && actor?.type === "NPC";
            },
            icon: '<i class="fas fa-arrow-right"></i>',
            callback: target => {
                const id = target.attr("data-document-id");
                const actor = game.actors.get(id);
                adjustActor(actor, actor.system.details.level, true, true, actor.name + " (MM3)");
            }
        })
    }
}

export function addActorContextMenuFindAndReplace(html, entryOptions) {
    if (game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.FIND_AND_REPLACE)) {
        entryOptions.push({
            name: game.i18n.localize("4ECOMPENDIUM.context.actor-find-and-replace"),
            condition: target => {
                const id = target.attr("data-document-id");
                const actor = game.actors.get(id);
                return game.user.hasPermission("ACTOR_CREATE") && actor?.type === "NPC";
            },
            icon: '<i class="fas fa-magnifying-glass-arrow-right"></i>',
            callback: target => {
                const id = target.attr("data-document-id");
                const actor = game.actors.get(id);
                actorFindAndReplaceDialog(actor);
            }
        })
    }
}

export function addFolderContextMenuAdjustMonster(html, entryOptions) {
    if (game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.MONSTER_ADJUSTMENT)) {
        entryOptions.push({
            name: game.i18n.localize("4ECOMPENDIUM.context.adjust-monster-level-folder"),
            condition: target => {
                const id = target.parent().attr("data-folder-id");
                const folder = game.folders.get(id);
                return game.user.hasPermission("ACTOR_CREATE") && folder?.type === "Actor";
            },
            icon: '<i class="fas fa-list-ul"></i>',
            callback: target => {
                const id = target.parent().attr("data-folder-id");
                const folder = game.folders.get(id);
                adjustActorFolderDialog(folder);
            }
        })
    }
}

export function addFolderContextMenuMM3Math(html, entryOptions) {
    if (game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.MONSTER_ADJUSTMENT)) {
        entryOptions.push({
            name: game.i18n.localize("4ECOMPENDIUM.context.mm3-math-folder"),
            condition: target => {
                const id = target.parent().attr("data-folder-id");
                const folder = game.folders.get(id);
                return game.user.hasPermission("ACTOR_CREATE") && folder?.type === "Actor";
            },
            icon: '<i class="fas fa-list-ul"></i>',
            callback: target => {
                const id = target.parent().attr("data-folder-id");
                const folder = game.folders.get(id);
                mm3ifyActorFolder(folder);
            }
        })
    }
}

export function addActorContextMenuMonsterKnowledge(html, entryOptions) {
    if (game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.MONSTER_ADJUSTMENT)) {
        entryOptions.push({
            name: game.i18n.localize("4ECOMPENDIUM.context.monster-knowledge"),
            condition: target => {
                const id = target.attr("data-document-id");
                const actor = game.actors.get(id);
                return game.user.hasPermission("ACTOR_CREATE") && actor?.type === "NPC";
            },
            icon: '<i class="fas fa-book"></i>',
            callback: target => {
                const id = target.attr("data-document-id");
                const actor = game.actors.get(id);
                addMonsterKnowledge(actor);
            }
        })
    }
}

export function addFolderContextMenuMonsterKnowledge(html, entryOptions) {
    if (game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.MONSTER_ADJUSTMENT)) {
        entryOptions.push({
            name: game.i18n.localize("4ECOMPENDIUM.context.monster-knowledge-folder"),
            condition: target => {
                const id = target.parent().attr("data-folder-id");
                const folder = game.folders.get(id);
                return game.user.hasPermission("ACTOR_CREATE") && folder?.type === "Actor";
            },
            icon: '<i class="fas fa-list-ul"></i>',
            callback: target => {
                const id = target.parent().attr("data-folder-id");
                const folder = game.folders.get(id);
                addMonsterKnowledgeFolder(folder);
            }
        })
    }
}

/***********************************************************************/
/* Dialogs */

async function adjustActorDialog(actor) {
    new Dialog({
        title: game.i18n.localize("4ECOMPENDIUM.adjust-actor.title"),
        content: await renderTemplate("modules/" + DnD4ECompendium.ID + "/templates/adjust-actor.hbs"),
        buttons: {
            build: {
                icon: '<i class="fas fa-hammer"></i>',
                label: "Build",
                callback: html => {
                    const level = html.find("input[name='level']");
                    adjustActor(actor, Number(level.val()), false, true);
                }
            },
            no: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel"
            }
        },
        default: "build"
    }, {
        width: 400
    }).render(true);
}

async function adjustActorFolderDialog(folder) {
    new Dialog({
        title: game.i18n.localize("4ECOMPENDIUM.adjust-actor-folder.title"),
        content: await renderTemplate("modules/" + DnD4ECompendium.ID + "/templates/adjust-actor-folder.hbs"),
        buttons: {
            build: {
                icon: '<i class="fas fa-hammer"></i>',
                label: "Build",
                callback: html => {
                    const leveldiff = html.find("input[name='level-diff']");
                    adjustActorFolder(folder, Number(leveldiff.val()));
                }
            },
            no: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel"
            }
        },
        default: "build"
    }, {
        width: 400
    }).render(true);
}

async function actorFindAndReplaceDialog(actor) {
    new Dialog({
        title: game.i18n.localize("4ECOMPENDIUM.find-and-replace.title"),
        content: await renderTemplate("modules/" + DnD4ECompendium.ID + "/templates/actor-find-and-replace.hbs"),
        buttons: {
            find_and_replace: {
                icon: '<i class="fas fa-magnifying-glass-arrow-right"></i>',
                label: "Find and Replace",
                callback: html => {
                    const find = html.find("input[name='find']");
                    const replace = html.find("input[name='replace']");
                    const caseSensitive = html.find("input[name='cs']")[0].checked;
                    const searchItemDescriptions = html.find("input[name='itemDescriptions']")[0].checked;
                    const searchItemNames = html.find("input[name='itemNames']")[0].checked;
                    const searchActorName = html.find("input[name='actorName']")[0].checked;
                    actorFindAndReplace(actor, find.val(), replace.val(), caseSensitive, searchItemDescriptions, searchItemNames, searchActorName);
                }
            },
            no: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel"
            }
        },
        default: "find_and_replace"
    }, {
        width: 400
    }).render(true);
}

/***********************************************************************/
/* Utility functions */

function parseDamageString(str) {
    const expr = [1, 0, 0];
    const match = str.match(/^(?<count>\d+)?d?(?<dice>\d+)?(\s*\+\s*)?(?<fixed>\d+)?/);

    if (match) {
        if (match.groups.count && match.groups.dice) {
            expr[0] = Number(match.groups.count);
            expr[1] = Number(match.groups.dice);
        }
        if (match.groups.fixed) {
            expr[2] = Number(match.groups.fixed);
        }
        if (match.groups.count && !match.groups.dice) {
            expr[2] = Number(match.groups.count);
        }

        return { "expression": expr, "match": match[0] };
    }
}

function makeDamageString(expr) {
    if (expr[0] && expr[1] && expr[2]) {
        return expr[0] + "d" + expr[1] + " + " + expr[2];
    } else if (expr[0] && expr[1]) {
        return expr[0] + "d" + expr[1];
    } else if (expr[2]) {
        return expr[2].toString();
    } else {
        return "";
    }
}

function getDamageExpression(power) { // An array 4d6+3 damage -> [4, 6, 3], or 5 damage -> [1, 0, 5];
    const quantity = Number(power.system.hit.baseQuantity);
    let die = 0;
    let fixed = 0;

    if (power.system.hit.baseDiceType != "flat") {
        die = Number(power.system.hit.baseDiceType.replace("d", ""));
    }

    const match = power.system.hit.formula.match(/\d+/g);

    if (match) {
        fixed = Number(match[0]);
    }

    return [quantity, die, fixed];
}

function meanDamage(expr) {
    if (expr[1]) {
        return expr[0] * (0.5 + 0.5 * expr[1]) + expr[2];
    } else {
        return expr[2];
    }
}

/* Negative number -> -1, positive number -> 1, zero -> 0 */
function getDirection(number) {
    if (number < 0) {
        return -1;
    } else if (number > 0) {
        return +1;
    } else {
        return 0;
    }
}

function moveDiceChain(die, direction) {
    const positions = {
        "4": 0,
        "6": 1,
        "8": 2,
        "10": 3,
        "12": 4
    };

    const dice = [4, 6, 8, 10, 12];

    const pos = positions[die];
    let newPos = pos + direction;

    if (newPos < 0) {
        return dice[4];
    } else if (newPos > 4) {
        return dice[0];
    } else {
        return dice[newPos];
    }
}

function moveDiceCount(count, direction) {
    const counts = [1, 2, 3, 4, 5, 6];

    const pos = count - 1;
    let newPos = pos + direction;

    if (newPos < 0) {
        return counts[5];
    } else if (newPos > 5) {
        return counts[0];
    } else {
        return counts[newPos];
    }
}

function findDamageExpression(expr, targetMean, targetFixed, adjustFixedDamage = true) {
    const direction = getDirection(targetMean - meanDamage(expr));
    const candidateDamageExpressions = [];
    let found = false;

    /* In the unlikely event of a perfect match */
    if (direction == 0) {
        found = true;
        return expr;
    }

    /* Try altering the dice size */
    for (let dieSize = expr[1]; dieSize != 2 && dieSize != 14; dieSize += direction * 2) {

        const newDamageExpression = [expr[0], dieSize, targetFixed];
        candidateDamageExpressions.push(newDamageExpression);

        const mean = meanDamage(newDamageExpression);

        if (Math.abs(mean - targetMean) / targetMean < 0.1) {
            found = true;
            break;
        }
    }

    /* Try altering the dice count */
    if (!found) {
        for (let i = 1; i <= 5; i++) { // Set the dice size
            if (found) {
                break;
            }
            let dieSize = expr[1];

            for (let j = i; j > 1; j--) {
                dieSize = moveDiceChain(dieSize, direction);
            }

            for (let m = 1; m <= 6; m++) {

                let diceCount = expr[0];
                for (let n = m; n > 1; n--) {// Set the dice count
                    diceCount = moveDiceCount(diceCount, direction);
                }

                const newDamageExpression = [diceCount, dieSize, targetFixed];
                candidateDamageExpressions.push(newDamageExpression);

                const mean = meanDamage(newDamageExpression);

                if (Math.abs(mean - targetMean) / targetMean < 0.1) {
                    found = true;
                    break;
                }
            }
        }
    }

    /* If everything fails, get the closest damage expression */
    if (!found) {
        function sortingFunction(expr1, expr2) { // Flush the best fit to the end of the array
            if (Math.abs(meanDamage(expr1) - targetMean) < Math.abs(meanDamage(expr2) - targetMean)) {
                return 1;
            } else if (Math.abs(meanDamage(expr1) - targetMean) > Math.abs(meanDamage(expr2) - targetMean)) {
                return -1;
            } else {
                return 0;
            }
        }

        /* Fetch the damage expression that is closest to the target */
        candidateDamageExpressions.sort(sortingFunction);
    }

    /* Result thus far */
    const candidateExpression = candidateDamageExpressions[candidateDamageExpressions.length - 1];

    /* Adjust the fixed damage */
    if (adjustFixedDamage) {
        const diff = meanDamage(candidateExpression) - targetMean;
        candidateExpression[2] -= Math.round(diff);
    }

    return candidateExpression;
}

function divisibleQ(n, step) {
    return n % step == 0;
}


/***********************************************************************/
/* Adjustment functions */

async function adjustActorFolder(folder, leveldiff) {
    for (const actor of folder.contents) {
        if (actor.type === "NPC") {
            await adjustActor(actor, actor.system.details.level + leveldiff, false, true);
        }
    }
}

async function mm3ifyActorFolder(folder) {
    for (const actor of folder.contents) {
        if (actor.type === "NPC") {
            await adjustActor(actor, actor.system.details.level, true, true, actor.name + " (MM3)");
        }
    }
}

async function addMonsterKnowledgeFolder(folder) {
    for (const actor of folder.contents) {
        if (actor.type === "NPC") {
            await addMonsterKnowledge(actor);
        }
    }
}

async function adjustActor(actor, level, legacy = false, copy = false, copyName = "") {
    if (actor.type === "NPC" && (level - actor.system.details.level != 0 || legacy)) {

        let monster = null;

        if (copy) {
            let clone = null;
            if (copyName) {
                clone = actor.clone({ "name": copyName });
            } else {
                clone = actor.clone({ "name": actor.name + " (Level " + level + ")" });
            }
            monster = await Actor.create(clone);
        } else {
            monster = actor;
        }

        const oldAbilities = monster.system.abilities;
        await adjustHP(monster, level, legacy);
        await adjustXP(monster, level);
        await adjustDefences(monster, level, legacy);
        await adjustAbilities(monster, level);
        await adjustPerception(monster, level);
        await adjustPowers(monster, level, legacy);
        await adjustSkills(monster, level, oldAbilities); // Adjust abilities before this
        await adjustResistances(monster, level);
        await adjustSurges(monster, level);
        await monster.update({ "system.details.level": level });
    }
}

async function actorFindAndReplace(actor, find, replace, caseSensitive = false, searchItemDescriptions = true, searchItemNames = false, searchActorName = false) {
    if (actor.type === "NPC") {
        const clone = await actor.clone({ "name": actor.name + " (Edited)" });
        const monster = await Actor.create(clone);
        const pattern = caseSensitive ? new RegExp(escapeRegExp(find), "g") : new RegExp(escapeRegExp(find), "gi");
        const pattern2 = new RegExp("^" + escapeRegExp(replace));

        for (const item of monster.items) {
            const data = { system: { description: { value: "" } } };

            // Search item description
            if (searchItemDescriptions) {
                data.system.description.value = item.system.description.value.replaceAll(pattern, replace);
            } else {
                data.system.description.value = item.system.description.value;
            }

            if (searchItemNames) {
                // Search item name and capitalize if word
                data.name = item.name.replaceAll(pattern, replace);
                data.name = data.name.replaceAll(" " + replace, " " + capitalize(replace));
                data.name = data.name.replace(pattern2, capitalize(replace));
            }

            await item.update(data);
        }

        if (searchActorName) {
            // Search actor name and capitalize if word
            let name = actor.name.replaceAll(pattern, replace);
            name = name.replaceAll(" " + replace, " " + capitalize(replace));
            name = name.replace(pattern2, capitalize(replace));

            if (name != actor.name) {
                await monster.update({ "name": name, "prototypeToken": { "name": name } });
            }
        }
    }
}

async function adjustHP(monster, level, legacy = false) {
    const secondary = monster.system.details.role.secondary;
    const role = secondary + "-" + monster.system.details.role.primary;
    const scalingFunction = lookup.scalingFunctions[role].HP; // Rescales HP according to MM3
    let referenceFunction = scalingFunction; // Gets the average HP of similar monsters

    if (legacy && secondary === "solo") { // Check whether monster uses old HP scaling
        const mm3Diff = Math.abs(monster.system.attributes.hp.value - scalingFunction(monster.system.details.level));
        const legacyDiff = Math.abs(monster.system.attributes.hp.value - lookup.scalingFunctions[role].HPLegacyHigh(monster.system.details.level));

        referenceFunction = legacyDiff < mm3Diff ? lookup.scalingFunctions[role].HPLegacyHigh : scalingFunction;
    }

    const offsetFactor = monster.system.attributes.hp.max / referenceFunction(monster.system.details.level); // How different from average?
    const newHP = Math.round(offsetFactor * scalingFunction(level));

    await monster.update({
        "system.attributes.hp.max": newHP,
        "system.attributes.hp.value": newHP,
        "system.attributes.hp.starting": newHP
    });
}

async function adjustXP(monster, level) {
    const newXP = lookup.xp[monster.system.details.role.secondary][level];
    if (newXP) {
        await monster.update({
            "system.details.exp": newXP
        });
    }
}

async function adjustDefences(monster, level, legacy = false) {
    const role = monster.system.details.role.secondary + "-" + monster.system.details.role.primary;
    const scalingFunctionAC = lookup.scalingFunctions[role].AC;
    const scalingFunctionNAD = lookup.scalingFunctions[role].NAD;
    const referenceFunctionAC = legacy ? lookup.scalingFunctions[role].ACLegacy : scalingFunctionAC;
    const referenceFunctionNAD = legacy ? lookup.scalingFunctions[role].NADLegacy : scalingFunctionNAD;

    const offsetAC = monster.system.defences.ac.value - referenceFunctionAC(monster.system.details.level);
    const offsetFort = monster.system.defences.fort.value - referenceFunctionNAD(monster.system.details.level);
    const offsetRef = monster.system.defences.ref.value - referenceFunctionNAD(monster.system.details.level);
    const offsetWil = monster.system.defences.wil.value - referenceFunctionNAD(monster.system.details.level);
    const newAC = Math.max(Math.round(scalingFunctionAC(level) + offsetAC), 1);
    const newFort = Math.max(Math.round(scalingFunctionNAD(level) + offsetFort), 1);
    const newRef = Math.max(Math.round(scalingFunctionNAD(level) + offsetRef), 1);
    const newWil = Math.max(Math.round(scalingFunctionNAD(level) + offsetWil), 1);

    await monster.update({
        "system.defences.ac.base": newAC,
        "system.defences.fort.base": newFort,
        "system.defences.ref.base": newRef,
        "system.defences.wil.base": newWil
    });
}

async function adjustAbilities(monster, level) {
    const primary = monster.system.details.role.primary;
    const secondary = monster.system.details.role.secondary;
    const scalingFunction = lookup.scalingFunctions[secondary + "-" + primary].abilities;

    const baseAbility = scalingFunction(monster.system.details.level);
    const offsetCha = monster.system.abilities.cha.value - baseAbility;
    const offsetCon = monster.system.abilities.con.value - baseAbility;
    const offsetDex = monster.system.abilities.dex.value - baseAbility;
    const offsetInt = monster.system.abilities.int.value - baseAbility;
    const offsetStr = monster.system.abilities.str.value - baseAbility;
    const offsetWis = monster.system.abilities.wis.value - baseAbility;
    const newCha = Math.max(Math.round(scalingFunction(level) + offsetCha), 1);
    const newCon = Math.max(Math.round(scalingFunction(level) + offsetCon), 1);
    const newDex = Math.max(Math.round(scalingFunction(level) + offsetDex), 1);
    const newInt = Math.max(Math.round(scalingFunction(level) + offsetInt), 1);
    const newStr = Math.max(Math.round(scalingFunction(level) + offsetStr), 1);
    const newWis = Math.max(Math.round(scalingFunction(level) + offsetWis), 1);

    await monster.update({
        "system.abilities.cha.value": newCha,
        "system.abilities.con.value": newCon,
        "system.abilities.dex.value": newDex,
        "system.abilities.int.value": newInt,
        "system.abilities.str.value": newStr,
        "system.abilities.wis.value": newWis
    });
}

async function adjustInitiative(monster, level, legacy = false) {
    const role = monster.system.details.role.secondary + "-" + monster.system.details.role.primary;
    const scalingFunction = lookup.scalingFunctions[role].init;
    const referenceFunction = legacy ? lookup.scalingFunctions[role].initLegacy : scalingFunction;

    const offset = monster.system.attributes.init.bonus[0].value - referenceFunction(monster.system.details.level);
    const newInit = Math.max(Math.round(scalingFunction(level) + offset), 1);
    const bonus = monster.system.attributes.init.bonus;
    bonus[0].value = newInit;

    await monster.update({
        "system.attributes.init.bonus": bonus
    });
}

async function adjustPerception(monster, level) {
    const role = monster.system.details.role.secondary + "-" + monster.system.details.role.primary;
    const scalingFunction = lookup.scalingFunctions[role].perception;

    const base = scalingFunction(monster.system.details.level);
    const offset = monster.system.skills.prc.base - base;
    const newPrc = Math.max(Math.round(scalingFunction(level) + offset), 0);

    await monster.update({
        "system.skills.prc.base": newPrc
    });
}

async function adjustPowers(monster, level, legacy = false) {

    const role = monster.system.details.role.secondary + "-" + monster.system.details.role.primary;
    const isMinion = monster.system.details.role.secondary === "minion";
    const levelDirection = Math.min(Math.max(level - monster.system.details.level, -1), 1);

    for (let item of monster.items) {

        /**********************************************************************/
        /**** Scale damage ****/

        if (item.type === "power" && item.system.hit.isDamage) {

            { /* Handle main damage */
                const expr = getDamageExpression(item);
                const mean = meanDamage(expr);
                const fixedFraction = expr[2] / mean;
                const isFlat = expr[1] ? false : true;

                let scalingFunction = null; // Compute average damage of target level.
                let referenceFunction = null; // Compare original damage with similar monsters.

                if (isFlat) {
                    scalingFunction = lookup.scalingFunctions[role].damageFlat;
                    referenceFunction = legacy ? lookup.scalingFunctions[role].damageFlatLegacy : scalingFunction;
                } else {
                    scalingFunction = lookup.scalingFunctions[role].damage;
                    referenceFunction = legacy ? lookup.scalingFunctions[role].damageLegacy : scalingFunction;
                }

                const offsetFactor = mean / referenceFunction(monster.system.details.level); // How different from similar monsters?
                const targetMeanDamage = offsetFactor * scalingFunction(level);
                const targetFixedDamage = Math.round(fixedFraction * targetMeanDamage);

                /* Find alternative damage, for example damage when bloodied. */
                const alternativeDamagePattern = RegExp("(?<prefix>(damage, or )|(damage \\(or )|(damage \\(crit )|(damage \\())((?<count>\\d*)d(?<dice>\\d*))?(\\s*\\+\\s*)?(?<fixed>\\d+)");
                let alternativeDamageExpression = [1, 0, 0];
                let altCrit = false;

                /* Check whether description or hit details contain an alternative damage expression */
                const match = item.system.description.value?.match(alternativeDamagePattern);
                const detailMatch = item.system.hit.detail?.match(alternativeDamagePattern);

                if (match) {
                    alternativeDamageExpression = parseDamageString(match[0].replace(match.groups.prefix, "")).expression;
                    if (match.groups.prefix === "damage (crit ") {
                        altCrit = true;
                    }
                } else if (detailMatch) {
                    alternativeDamageExpression = parseDamageString(detailMatch[0].replace(detailMatch.groups.prefix, "")).expression;
                    if (detailMatch.groups.prefix === "damage (crit ") {
                        altCrit = true;
                    }
                }

                const alternativeMeanDamage = meanDamage(alternativeDamageExpression);
                const targetAlternativeMeanDamage = alternativeMeanDamage / mean * targetMeanDamage;
                const targetAlternativeFixedFraction = alternativeDamageExpression[2] / alternativeMeanDamage;
                const targetAlternativeFixedDamage = Math.round(targetAlternativeFixedFraction * targetAlternativeMeanDamage);

                /* Find new damage expressions */
                let newDamageExpression = [1, 0, 0];
                let newAlternativeDamageExpression = [1, 0, 0];

                if (isFlat) { // Handle flat damage
                    if (!isMinion && divisibleQ(fixedFraction, 5)) { // Is flat damage on increment 5 scale?
                        newDamageExpression[2] = 5 * Math.round(targetFixedDamage / 5);
                    } else {
                        newDamageExpression[2] = targetFixedDamage;
                    }

                    if (alternativeDamageExpression[1] === 0 && alternativeDamageExpression[2] != 0) {
                        newAlternativeDamageExpression[2] = Math.round(targetAlternativeMeanDamage);
                    }
                } else { // Handle damage rolls
                    newDamageExpression = findDamageExpression(expr, targetMeanDamage, targetFixedDamage, true, legacy);
                    if (alternativeDamageExpression[1] != 0) {
                        newAlternativeDamageExpression = findDamageExpression(alternativeDamageExpression, targetAlternativeMeanDamage, targetAlternativeFixedDamage, true, legacy);
                    }
                }

                /* Change description */
                const damageStringPattern = RegExp(makeDamageString(expr).replaceAll("+", "\\+"));
                const damageStringPatternNoSpace = RegExp(makeDamageString(expr).replaceAll("+", "\\+").replaceAll(" ", ""));
                let newDescription = item.system.description.value ?? "";
                let newHitDetail = item.system.hit.detail ?? "";

                if (item.system.description.value?.match(damageStringPattern) || item.system.hit.detail?.match(damageStringPattern)) {
                    // Try expression with spaces
                    newDescription = item.system.description.value ? item.system.description.value.replace(damageStringPattern, makeDamageString(newDamageExpression)) : "";
                    newHitDetail = item.system.hit.detail ? item.system.hit.detail.replace(damageStringPattern, makeDamageString(newDamageExpression)) : "";

                    // Alternative damage
                    if (match) {
                        newDescription = newDescription.replace(match[0], match.groups.prefix + makeDamageString(newAlternativeDamageExpression));
                    }
                    if (detailMatch) {
                        newHitDetail = newHitDetail.replace(detailMatch[0], detailMatch.groups.prefix + makeDamageString(newAlternativeDamageExpression));
                    }
                } else {
                    // Try expression without spaces
                    newDescription = item.system.description.value ? item.system.description.value.replace(damageStringPatternNoSpace, makeDamageString(newDamageExpression)) : "";
                    newHitDetail = item.system.hit.detail ? item.system.hit.detail.replace(damageStringPatternNoSpace, makeDamageString(newDamageExpression)) : "";

                    // Alternative damage
                    if (match) {
                        newDescription = newDescription.replace(match[0], match.groups.prefix + makeDamageString(newAlternativeDamageExpression).replaceAll(" ", ""));
                    }
                    if (detailMatch) {
                        newHitDetail = newHitDetail.replace(detailMatch[0], detailMatch.groups.prefix + makeDamageString(newAlternativeDamageExpression));
                    }
                }

                /* Update power */
                await item.update({
                    "system.hit.baseQuantity": newDamageExpression[0].toString(),
                    "system.hit.baseDiceType": newDamageExpression[1] === 0 ? "flat" : "d" + newDamageExpression[1].toString(),
                    "system.hit.formula": item.system.hit.formula.replace(/\d+/, newDamageExpression[2]),
                    "system.hit.critFormula": altCrit ? makeDamageString(newAlternativeDamageExpression) + " + @dmgMod" : item.system.hit.critFormula.replace(/\d+/, newDamageExpression[2]),
                    "system.description.value": newDescription,
                    "system.hit.detail": newHitDetail
                });
            }

            /* Handle secondary damage */
            if (item.system.damage.parts.length > 0) {

                const scalingFunction = lookup.scalingFunctions[role].damageSecondary;
                const referenceFunction = legacy ? lookup.scalingFunctions[role].damageSecondaryLegacy : scalingFunction;

                let newDamageExpression = [1, 0, 0];
                const newParts = []; // This is the parts array of the actor
                const newCritParts = [];
                let newDescription = item.system.description.value ?? "";
                let newHitDetail = item.system.hit.detail ?? "";

                for (const dam of item.system.damage.parts) {
                    const secondaryDamage = parseDamageString(dam[0]);
                    const secondaryDamageMean = meanDamage(secondaryDamage.expression);
                    const offsetFactor = secondaryDamageMean / referenceFunction(monster.system.details.level);
                    const targetSecondaryDamage = offsetFactor * scalingFunction(level);

                    if (secondaryDamage.expression[1] === 0) { // Handle flat damage
                        newDamageExpression[2] = Math.round(targetSecondaryDamage);
                    } else { // Handle damage rolls
                        newDamageExpression = findDamageExpression(secondaryDamage.expression, targetSecondaryDamage, secondaryDamage.expression[2], false, legacy);
                    }

                    newParts.push([makeDamageString(newDamageExpression), dam[1]]);
                    newCritParts.push([makeDamageString(newDamageExpression).replaceAll("d", "*"), dam[1]]);

                    /* Change description */
                    const damageStringPattern = RegExp("plus " + secondaryDamage.match.replaceAll("+", "\\+"));
                    const damageStringPatternNoSpace = RegExp("plus " + secondaryDamage.match.replaceAll("+", "\\+").replaceAll(" ", ""));

                    if (newDescription.match("plus " + secondaryDamage.match)) {
                        // Try expression as is
                        newDescription = newDescription.replace(damageStringPattern, "plus " + makeDamageString(newDamageExpression));
                    } else {
                        // Try without spaces
                        newDescription = newDescription.replace(damageStringPatternNoSpace, "plus " + makeDamageString(newDamageExpression).replaceAll(" ", ""));
                    }

                    if (newHitDetail.match("plus " + secondaryDamage.match)) {
                        // Try expression as is
                        newHitDetail = newHitDetail.replace(damageStringPattern, "plus " + makeDamageString(newDamageExpression));
                    } else {
                        // Try without spaces
                        newHitDetail = newHitDetail.replace(damageStringPatternNoSpace, "plus " + makeDamageString(newDamageExpression).replaceAll(" ", ""));
                    }
                }

                /* Update power */
                await item.update({
                    "system.damage.parts": newParts,
                    "system.damageCrit.parts": newCritParts,
                    "system.description.value": newDescription,
                    "system.hit.detail": newHitDetail
                })
            }
        }

        /**********************************************************************/
        /**** Scale ongoing damage ****/

        {
            let newDescription = item.system.description.value ?? "";
            let newHitDetail = item.type === "power" && item.system.hit.detail ? item.system.hit.detail : "";

            const match = newDescription.match(/ongoing (?<damage>\d+)/);
            const detailMatch = newHitDetail.match(/ongoing (?<damage>\d+)/);

            if (match || detailMatch) {
                const scalingFunction = lookup.scalingFunctions[role].damageOngoing;
                const referenceFunction = legacy ? lookup.scalingFunctions[role].damageOngoingLegacy : scalingFunction;
                const damage = match ? Number(match.groups.damage) : Number(detailMatch.groups.damage);
                const offsetFactor = damage / referenceFunction(monster.system.details.level);

                let targetDamage;

                if (divisibleQ(damage, 5)) { // Check if damage is on 5 increment scale
                    targetDamage = 5 * Math.round(offsetFactor * scalingFunction(level) / 5);
                } else {
                    targetDamage = Math.round(offsetFactor * scalingFunction(level));
                }

                newDescription = match ? newDescription.replace("ongoing " + match.groups.damage, "ongoing " + targetDamage.toString()) : newDescription;
                newHitDetail = detailMatch ? newHitDetail.replace("ongoing " + detailMatch.groups.damage, "ongoing " + targetDamage.toString()) : newHitDetail;

                /* Update power */
                await item.update({
                    "system.description.value": newDescription
                });

                if (detailMatch) {
                    await item.update({
                        "system.hit.detail": newHitDetail
                    })
                }
            }
        }

        /**********************************************************************/
        /**** Scale attack bonus ****/

        if (item.type === "power" && item.system.attack.isAttack && (levelDirection != 0 || legacy)) {
            const attack = Number(item.system.attack.formula.match(/\d+/)[0]);

            let scalingFunction = lookup.scalingFunctions[role].attackAC;
            let referenceFunction = legacy ? lookup.scalingFunctions[role].attackACLegacy : scalingFunction;

            if (item.system.attack.def != "ac") {
                scalingFunction = lookup.scalingFunctions[role].attackNAD;
                referenceFunction = legacy ? lookup.scalingFunctions[role].attackNADLegacy : scalingFunction;
            }

            const offset = attack - referenceFunction(monster.system.details.level);
            const targetAttack = Math.round(scalingFunction(level) + offset);

            /* Change description */
            const newDescription = item.system.description.value.replace("+" + attack + " vs", "+" + targetAttack + " vs");

            /* Update power */
            await item.update({
                "system.attack.formula": item.system.attack.formula.replace(/\d+/, targetAttack.toString()),
                "system.description.value": newDescription
            });
        }

        /**********************************************************************/
        /**** Scale DCs ****/

        if (levelDirection != 0) {
            let newDescription = item.system.description.value ?? "";
            let newHitDetail = item.type === "power" && item.system.hit.detail ? item.system.hit.detail : "";

            const match = newDescription.match(/DC (?<DC>\d+)/);
            const detailMatch = newHitDetail.match(/DC (?<DC>\d+)/);

            if (match) {
                const dc = Number(match.groups.DC);
                const easyDiff = Math.abs(lookup.dc.easy(monster.system.details.level) - dc);
                const mediumDiff = Math.abs(lookup.dc.moderate(monster.system.details.level) - dc);
                const hardDiff = Math.abs(lookup.dc.hard(monster.system.details.level) - dc);

                const difficulty = [["easy", easyDiff], ["medium", mediumDiff], ["hard", hardDiff]].sort((a, b) => a[1] - b[1])[0][0];
                const newDC = Math.round(lookup.dc[difficulty](level));

                newDescription = newDescription.replace(/DC (?<DC>\d+)/, "DC " + newDC);

                await item.update({
                    "system.description.value": newDescription
                });
            }

            if (detailMatch) {
                const dc = Number(detailMatch.groups.DC);
                const easyDiff = Math.abs(lookup.dc.easy(monster.system.details.level) - dc);
                const mediumDiff = Math.abs(lookup.dc.moderate(monster.system.details.level) - dc);
                const hardDiff = Math.abs(lookup.dc.hard(monster.system.details.level) - dc);

                const difficulty = [["easy", easyDiff], ["medium", mediumDiff], ["hard", hardDiff]].sort((a, b) => a[1] - b[1])[0][0];
                const newDC = Math.round(lookup.dc[difficulty](level));

                newHitDetail = newHitDetail.replace(/DC (?<DC>\d+)/, "DC " + newDC);

                await item.update({
                    "system.hit.detail": newHitDetail
                });
            }
        }
    }
}

async function adjustSkills(monster, level, oldAbilities) { // This assumes that abilities have been adjusted
    const diff = Math.floor(0.5 * (level - monster.system.details.level));
    const newSkills = monster.system.skills;

    for (const key in newSkills) {
        const ability = newSkills[key].ability;
        const modDiff = monster.system.abilities[ability].mod - oldAbilities[ability].mod;

        if (diff < 0 && key != "prc" && newSkills[key].base != 0) {
            newSkills[key].base += Math.max(diff + modDiff, -1 * newSkills[key].base);
            newSkills[key].value += Math.max(diff + modDiff, -1 * newSkills[key].value);
        } else if (diff > 0 && key != "prc" && newSkills[key].base != 0) {
            newSkills[key].base += diff + modDiff;
            newSkills[key].value += diff + modDiff;
        }
    }

    await monster.update({
        "system.skills": newSkills
    });
}

async function adjustResistances(monster, level) {

    const role = monster.system.details.role.secondary + "-" + monster.system.details.role.primary;
    const scalingFunction = lookup.scalingFunctions[role].resistance;
    const newResistances = monster.system.resistances;

    /* Look through all resistances */
    for (const key in newResistances) {
        if (newResistances[key].bonus.length > 0) {
            const val = Number(newResistances[key].bonus[0].value);

            if (val > 0) { // Vulnerabilities don't seem to scale with level. Ignore.
                const offsetFactor = val / scalingFunction(monster.system.details.level);
                const targetResistance = Math.round(offsetFactor * scalingFunction(level));
                newResistances[key].value = 0;
                if (divisibleQ(val, 5)) { // Check if resistance is on 5 increment scale
                    newResistances[key].bonus[0].value = (5 * Math.round(targetResistance / 5)).toString();
                } else {
                    newResistances[key].bonus[0].value = targetResistance.toString();
                }
            } else {
                newResistances[key].value = 0; // Reset this to zero, or bonus will apply twice.
            }
        }
    }

    /* Update monster */
    await monster.update({
        "system.resistances": newResistances
    });
}

async function adjustSurges(monster, level) {
    if (monster.system.details.surges.max > monster.system.details.tier) {
        // Special NPC. Do nothing.
    } else {
        const surges = Math.floor(Math.ceil(level / 10), 3);
        await monster.update({
            "system.details.surges.value": surges,
            "system.details.surges.max": surges
        });
    }
}

async function addMonsterKnowledge(actor) {
    // Details
    const dcModerate = Math.round(lookup.dc.moderate(actor.system.details.level));
    const dcHard = Math.round(lookup.dc.hard(actor.system.details.level));
    const type = actor.system.details.other ? lookup.monsterType[actor.system.details.type] + " (" + actor.system.details.other.toLowerCase() + ")" : lookup.monsterType[actor.system.details.type];

    const role = ["Level " + actor.system.details.level];

    if (actor.system.details.role.secondary != "standard") {
        role.push(capitalize(actor.system.details.role.secondary));
    }

    role.push(capitalize(actor.system.details.role.primary));

    if (actor.system.details.role.leader) {
        role.push("(Leader)");
    }

    const keyWords = union(actor.items.contents.map(x => x.system.keyWords).flat().filter(x => x)).join(", ");

    // Resistances and vulnerabilities
    const resistances = actor.system.untypedResistances.resistances ?? [];
    const immunities = actor.system.untypedResistances.immunities ?? [];
    const vulnerabilities = actor.system.untypedResistances.vulnerabilities ?? [];

    for (const [key, value] of Object.entries(actor.system.resistances)) {
        const type = key === "damage" ? "all damage" : key;
        if (value.value > 0) {
            resistances.push(value.value + " " + type);
        } else if (value.value < 0) {
            vulnerabilities.push(Math.abs(value.value) + " " + type);
        } else if (value.immune) {
            immunities.push(key);
        }
    }

    const resistanceString = resistances.join(", ");
    const immunityString = immunities.join(", ");
    const vulnerabilityString = vulnerabilities.join(", ");

    // Assemble moderate description
    const descriptionModerate = [
        "<h1>" + actor.prototypeToken.name + "</h1>",
        "<p><b>Role: </b>" + role.join(" "),
        "<p><b>Type: </b>" + capitalize(actor.system.details.origin) + " " + type + "</p>"
    ];

    if (keyWords.length) {
        descriptionModerate.push("<p><b>Keywords: </b>" + keyWords + "</p>");
    }

    // Assemble hard description
    const descriptionHard = [...descriptionModerate];

    if (resistanceString) {
        descriptionHard.push("<p><b>Resistances: </b>" + resistanceString + "</p>");
    }
    if (immunityString) {
        descriptionHard.push("<p><b>Immunities: </b>" + immunityString + "</p>");
    }
    if (vulnerabilityString) {
        descriptionHard.push("<p><b>Vulnerabilities: </b>" + vulnerabilityString + "</p>");
    }

    // Powers and Traits
    const powers = actor.items.contents.filter(x => x.type === "power").map(x => "<h3>" + x.name + "</h3>" + x.system.description.value);
    const traits = actor.items.contents.filter(x => x.type === "classFeats").map(x => "<h3>" + x.name + "</h3>" + x.system.description.value);
    descriptionHard.push("<h2>Traits</h2>" + traits.join(""));
    descriptionHard.push("<h2>Powers</h2>" + powers.join(""));

    const moderate = {
        "name": `Monster Knowledge (DC ${dcModerate})`,
        "type": "destinyFeats",
        "img": "icons/svg/book.svg",
        "system.description.value": descriptionModerate.join("")
    };

    const hard = {
        "name": `Monster Knowledge (DC ${dcHard})`,
        "type": "destinyFeats",
        "img": "icons/svg/book.svg",
        "system.description.value": descriptionHard.join("")
    };

    await actor.createEmbeddedDocuments("Item", [moderate, hard]);
}