import { DnD4ECompendium } from "../dnd-4e-compendium.js";
import { lookup, lookupMasterworkAC } from "./lookup_tables.js";

/***********************************************************************/
/* Buttons */

export function addCbuilderXMLImportButton(activeTab, html) {
    if (game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.CBUILDER_IMPORT)) {
        // Show the button only for users with actor creation rights
        if (activeTab.options.classes[2] === "actors-sidebar" && game.user.hasPermission("ACTOR_CREATE")) {

            const label = game.i18n.localize("4ECOMPENDIUM.buttons.importer-launch-button");
            const button = $(`<div class="action-buttons flexrow cbimport"><button type='button' id="cb-import-button" title=' ${label}'><i class="fas fa-file-import"></i>&nbsp;${label}</button></div>`);

            // Find the header button element and add
            const topBar = html.find(`[class="header-actions action-buttons flexrow"]`);
            topBar.after(button);

            html.on('click', '#cb-import-button', (event) => {
                importXMLDialog();
            });
        }
    }
}

export function addBuildEquipmentButton(activeTab, html) {
    if (game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.BUILD_MAGIC_ITEM)) {
        // Show the button only for users with actor creation rights
        if (activeTab.options.classes[2] === "items-sidebar" && game.user.hasPermission("ITEM_CREATE")) {

            const label = game.i18n.localize("4ECOMPENDIUM.buttons.equipment-build-button");
            const button = $(`<div class="action-buttons flexrow itembuild"><button type='button' id="equipment-build-button" title=' ${label}'><i class="fas fa-hammer"></i>&nbsp;${label}</button></div>`);

            // Find the header button element and add
            const topBar = html.find(`[class="header-actions action-buttons flexrow"]`);
            topBar.after(button);

            html.on('click', '#equipment-build-button', (event) => {
                buildEquipmentDialog();
            });
        }
    }
}

/***********************************************************************/
/* Dialogs */

async function importXMLDialog() {
    new Dialog({
        title: game.i18n.localize("4ECOMPENDIUM.import-cbuilder.title"),
        content: await renderTemplate("modules/" + DnD4ECompendium.ID + "/templates/import-cbuilder.hbs", {
            hint1: game.i18n.format("4ECOMPENDIUM.import-cbuilder.hint1"),
            hint2: game.i18n.format("4ECOMPENDIUM.import-cbuilder.hint2"),
            hint3: game.i18n.format("4ECOMPENDIUM.import-cbuilder.hint3")
        }),
        buttons: {
            import: {
                icon: '<i class="fas fa-file-import"></i>',
                label: "Import",
                callback: html => {
                    const form = html.find("form")[0];
                    const core = html.find("input[name='core']")[0].checked;
                    if (!form.data.files.length) { return ui.notifications.error("You did not provide a character file!") };
                    readTextFromFile(form.data.files[0]).then(xml => parseCharacter(xml, core));
                }
            },
            no: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel"
            }
        },
        default: "import"
    }, {
        width: 400
    }).render(true);
}

async function buildEquipmentDialog() {
    new Dialog({
        title: game.i18n.localize("4ECOMPENDIUM.build-equipment.title"),
        content: await renderTemplate("modules/" + DnD4ECompendium.ID + "/templates/build-equipment.hbs", {
            hint1: game.i18n.format("4ECOMPENDIUM.build-equipment.hint1"),
            hint2: game.i18n.format("4ECOMPENDIUM.build-equipment.hint2")
        }),
        buttons: {
            build: {
                icon: '<i class="fas fa-hammer"></i>',
                label: "Build",
                callback: html => {
                    const enchantment = html.find("input[name='enchantment']");
                    const base = html.find("input[name='base']");
                    buildMagicItem(base.val(), enchantment.val());
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

/***********************************************************************/
/* Character parsing */

async function parseCharacter(xml, core = false) {
    try {
        ui.notifications.info("Importing character. Please wait...");
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "text/xml");

        const compendiumPowers = game.packs.get(DnD4ECompendium.ID + ".module-powers");
        const compendiumCorePowers = game.packs.get(DnD4ECompendium.ID + ".module-core-powers");
        const compendiumItemPowers = game.packs.get(DnD4ECompendium.ID + ".module-item-powers");
        const compendiumFeats = game.packs.get(DnD4ECompendium.ID + ".module-feats");
        const compendiumRituals = game.packs.get(DnD4ECompendium.ID + ".module-rituals");
        const compendiumRaces = game.packs.get(DnD4ECompendium.ID + ".module-races");
        const compendiumClasses = game.packs.get(DnD4ECompendium.ID + ".module-classes");
        const compendiumThemes = game.packs.get(DnD4ECompendium.ID + ".module-themes");
        const compendiumBackgrounds = game.packs.get(DnD4ECompendium.ID + ".module-backgrounds");
        const compendiumDeities = game.packs.get(DnD4ECompendium.ID + ".module-deities");
        const compendiumPaths = game.packs.get(DnD4ECompendium.ID + ".module-paths");
        const compendiumDestinies = game.packs.get(DnD4ECompendium.ID + ".module-destinies");
        const compendiumFeatures = game.packs.get(DnD4ECompendium.ID + ".module-features");
        const compendiumLoot = game.packs.get(DnD4ECompendium.ID + ".module-equipment");
        const compendiumConsumables = game.packs.get(DnD4ECompendium.ID + ".module-consumables");

        const details = getDetails(doc);
        details["race"] = Object.values(getRulesElements(doc, "Race"))[0];
        details["subrace"] = getSubrace(doc);
        details["class"] = getClass(doc);
        details["theme"] = Object.values(getRulesElements(doc, "Theme"))[0];
        details["path"] = Object.values(getRulesElements(doc, "Paragon Path"))[0];
        details["destiny"] = Object.values(getRulesElements(doc, "Epic Destiny"))[0];
        details["size"] = getSize(doc);

        const abilities = getAbilityScores(doc);
        const skills = Object.values(getRulesElements(doc, "Skill Training")).map(x => lookup.skill[x]);
        const proficiencies = parseProficiencies(Object.values(getRulesElements(doc, "Proficiency")));
        const vision = parseVision(Object.values(getRulesElements(doc, "Vision")));
        const powerPoints = getPowerPoints(doc);
        const languages = parseLanguages(Object.values(getRulesElements(doc, "Language")));

        const powerNames = getPowerNames(doc);
        const featNames = Object.values(getRulesElements(doc, "Feat"));
        const featureNames = Object.values(getRulesElements(doc, "Class Feature"));
        const traitNames = Object.values(getRulesElements(doc, "Racial Trait"));
        const backgroundNames = Object.values(getRulesElements(doc, "Background"));
        const deityNames = Object.values(getRulesElements(doc, "Deity"));
        const godFragmentNames = Object.values(getRulesElements(doc, "God Fragment"));

        const powerItems = await lookupItems(compendiumPowers, powerNames, lookup.power, "power", null, false, parseClasses(details.class));
        const corePowerItems = await compendiumCorePowers.getDocuments();
        const featItems = await lookupItems(compendiumFeats, featNames, lookup.feat, "no_parentheses", renameItem);
        const featureItems = await lookupItems(compendiumFeatures, featureNames, lookup.feature);
        const traitItems = await lookupItems(compendiumFeatures, traitNames, lookup.feature);

        let raceItems = [];
        let useSubrace = true;
        if (details.subrace) {
            raceItems = await lookupItems(compendiumRaces, [details.subrace], lookup.race);
        }
        if (raceItems.length == 0) {
            raceItems = await lookupItems(compendiumRaces, [details.race], lookup.race);
            useSubrace = false;
        }

        const classItems = await lookupItems(compendiumClasses, parseClasses(details.class), lookup.class, "full");
        const themeItems = await lookupItems(compendiumThemes, [details.theme], lookup.theme);
        const backgroundItems = await lookupItems(compendiumBackgrounds, backgroundNames, lookup.background);
        const deityItems = await lookupItems(compendiumDeities, deityNames, lookup.deity);
        const pathItems = await lookupItems(compendiumPaths, [details.path], lookup.path);
        const destinyItems = await lookupItems(compendiumDestinies, [details.destiny], lookup.destiny);
        const godFragmentItems = await lookupItems(compendiumFeats, godFragmentNames, lookup.godFragment);
        const godFragmentPowerItems = await lookupItems(compendiumPowers, godFragmentNames.map(x => "Feat-" + x), lookup.godFragment);

        const actor = await Actor.create({
            "name": details.name,
            "type": "Player Character"
        });

        if (actor) {
            await actor.update({
                "system.details.level": details.level,
                "system.details.tier": details.tier,
                "system.details.exp": details.exp,
                "system.details.class": details.class,
                "system.details.paragon": details.path,
                "system.details.epic": details.destiny,
                "system.details.race": useSubrace ? details.subrace.replace(/ \(.*\)/, "") : details.race,
                "system.details.size": details.size,
                "system.details.age": details.age,
                "system.details.gender": details.gender,
                "system.details.height": details.height,
                "system.details.weight": details.weight,
                "system.details.alignment": details.alignment,
                "system.details.deity": details.deity,
                "system.details.weaponProf.value": proficiencies.weapons,
                "system.details.armourProf.value": proficiencies.armor,
                "system.attributes.hp.autototal": true,
                "system.abilities.str.value": abilities.str,
                "system.abilities.con.value": abilities.con,
                "system.abilities.dex.value": abilities.dex,
                "system.abilities.int.value": abilities.int,
                "system.abilities.wis.value": abilities.wis,
                "system.abilities.cha.value": abilities.cha,
                "system.senses.special.value": vision,
                "system.languages": languages,
                "system.currency": parseMoney(details.carriedMoney, parseMoney(details.storedMoney)),
                "system.featureSortTypes": "name",
                "system.powerGroupTypes": "action",
                "system.powerSortTypes": "useType"
            });

            if (powerPoints) {
                await actor.update({
                    "system.resources.primary": {
                        "value": powerPoints,
                        "max": powerPoints,
                        "sr": true,
                        "lr": true,
                        "label": "Power Points"
                    }
                });
            }

            await setSkills(actor, skills);
            await actor.createEmbeddedDocuments("Item", powerItems);
            if (core) {
                await actor.createEmbeddedDocuments("Item", corePowerItems);
            } else {
                const exceptions = [
                    "Melee Basic Attack",
                    "Ranged Basic Attack",
                    "Ranged Basic Attack Heavy Thrown"
                ];
                await actor.createEmbeddedDocuments("Item", corePowerItems.filter(p => exceptions.includes(p.name)));
            }
            await actor.createEmbeddedDocuments("Item", featItems);
            await actor.createEmbeddedDocuments("Item", raceItems);
            await actor.createEmbeddedDocuments("Item", classItems);
            await actor.createEmbeddedDocuments("Item", themeItems);
            await actor.createEmbeddedDocuments("Item", backgroundItems);
            await actor.createEmbeddedDocuments("Item", deityItems);
            await actor.createEmbeddedDocuments("Item", pathItems);
            await actor.createEmbeddedDocuments("Item", destinyItems);
            await actor.createEmbeddedDocuments("Item", featureItems);
            await actor.createEmbeddedDocuments("Item", traitItems);
            await actor.createEmbeddedDocuments("Item", godFragmentItems);
            await actor.createEmbeddedDocuments("Item", godFragmentPowerItems);

            const loot = getLoot(doc);
            const ritualNames = [];

            // Go through all [{name:..., type:..., ...}, ...] composite items and build loot
            ui.notifications.info("Importing equipment. Please wait...");
            for (const compositeItem of loot) {
                let found = false;

                if (!["Ritual", "Ritual Scroll"].includes(compositeItem[0].type)) {
                    found = await importCBMagicItem(actor, compositeItem, compendiumLoot, compendiumItemPowers);

                    // Check if weapon has a secondary end and import that
                    if (lookup.twoEndWeapons.includes(compositeItem[0].name)) {
                        const secondaryItem = compositeItem;
                        secondaryItem[0].name = secondaryItem[0].name + " - Secondary End";
                        await importCBMagicItem(actor, secondaryItem, compendiumLoot, compendiumItemPowers);
                    }

                    if (!found) {
                        found = await importCBMagicItem(actor, compositeItem, compendiumConsumables, compendiumItemPowers);
                    }
                    if (!found) {
                        ui.notifications.error(compositeItem[0].name + " not found.");
                    }
                } else if (compositeItem[0].type === "Ritual") {
                    ritualNames.push(compositeItem[0].name);
                }
            }

            const ritualItems = await lookupItems(compendiumRituals, ritualNames, lookup.ritual);
            await actor.createEmbeddedDocuments("Item", ritualItems);

            ui.notifications.info("Character import complete.");
            return actor;
        }
    }
    catch (err) {
        ui.notifications.error("Could not parse CBuilder file: " + err);
    }
}

function getAbilityScores(doc) {
    const abilities = ["str", "con", "dex", "int", "wis", "cha"];
    const scores = {};

    function getScore(name) {
        return Number(doc.querySelectorAll("Stat > alias[name='" + name + "']")[0].parentNode.attributes.value.nodeValue);
    }

    abilities.map(name => scores[name] = getScore(name));

    return scores;
}

function getSize(doc) {
    const match = doc.querySelectorAll("Stat > alias[name='Size']")[0];
    const size = match.nextSibling.nextSibling.attributes[0].nodeValue;
    return lookup.size[size];
}

function getPowerPoints(doc) {
    const match = doc.querySelectorAll("Stat > alias[name='Power Points']")[0];
    if (match) {
        return Number(match.parentElement.attributes[0].nodeValue);
    } else {
        return 0;
    }
}

// Extract an id: RulesElement for a specific type (power, feat, etc.)
function getRulesElements(doc, type) {
    const elements = {};
    doc.querySelectorAll("RulesElementTally > RulesElement[type='" + type + "']").forEach(
        x => elements[x.attributes.charelem.nodeValue] = x.attributes.name.nodeValue
    );

    return elements;
}

// Extract the power names and discard obsolete powers
function getPowerNames(doc) {
    const powers = getRulesElements(doc, "Power");
    const powersObsolete = {}; // {id: name}
    const powersRetained = []; // [name]

    doc.querySelectorAll("RulesElement[type='Power'][replaces]").forEach(
        x => {
            const obsolete = x.attributes.replaces.nodeValue;
            powersObsolete[obsolete] = powers[obsolete]
        }
    );

    Object.keys(powers).map(id => powersObsolete[id] ? null : powersRetained.push(powers[id]));

    return powersRetained;
}

// Get the character name, level, age etc.
function getDetails(doc) {
    const details = {};

    function getDetail(type) {
        return doc.querySelector("Details > " + type).innerHTML.trim();
    }

    details["name"] = getDetail("name");
    details["name"] = details["name"] === "" ? "Unnamed Character" : details["name"];
    details["level"] = Number(getDetail("Level"));
    details["tier"] = Math.ceil(details["level"] / 3);
    details["height"] = getDetail("Height");
    details["weight"] = getDetail("Weight");
    details["age"] = getDetail("Age");
    details["exp"] = Number(getDetail("Experience"));
    details["carriedMoney"] = getDetail("CarriedMoney");
    details["storedMoney"] = getDetail("StoredMoney");

    const deity = doc.querySelector("RulesElement[type='Deity']");
    details["deity"] = deity ? deity.attributes.name.nodeValue : "";

    const gender = doc.querySelector("RulesElement[type='Gender']");
    details["gender"] = gender ? gender.attributes.name.nodeValue : "";

    const alignment = doc.querySelector("RulesElement[type='Alignment']");
    details["alignment"] = alignment ? alignment.attributes.name.nodeValue : "";

    return details;
}

function getSubrace(doc) {
    const match = doc.querySelectorAll("RulesElement[type='Race'] > RulesElement[type='Grants'] > RulesElement[name$='Subrace']");
    if (match.length > 0) {
        return match[0].childNodes[1].attributes.name.nodeValue;
    }
    else {
        return "";
    }
}

// Identify hybrid classes and build the class name
function getClass(doc) {
    const className = Object.values(getRulesElements(doc, "Class"))[0];
    if (className === "Hybrid") {
        const hybrid = Object.values(getRulesElements(doc, "Hybrid Class"));
        return hybrid[0].replace("Hybrid ", "") + "|" + hybrid[1].replace("Hybrid ", "");
    } else {
        return className;
    }
}

// Split hybrid classes and translate to compendium class names
function parseClasses(str) {
    const classNamesCB = str.split("|");
    const classNamesCompendium = [];

    if (classNamesCB.length > 1) {
        classNamesCB.map(x => classNamesCompendium.push(lookup.class["Hybrid " + x]));
    } else {
        classNamesCB.map(x => classNamesCompendium.push(lookup.class[x]));
    }

    return classNamesCompendium;
}

function parseProficiencies(proficiencies) {
    const weaponTypes = ["Weapon", "Implement"];
    const armorTypes = ["Armor", "Shield"];
    const weapons = [];
    const armor = [];
    const result = {};
    proficiencies.map(p => {
        const match = p.match(/(?<type>.*) Proficiency \((?<item>.*)\)/);
        if (match) {
            if (weaponTypes.includes(match.groups.type)) {
                const translated = lookup.proficiency[match.groups.item];
                translated ? weapons.push(translated) : null;
            }
            else if (armorTypes.includes(match.groups.type)) {
                const translated = lookup.proficiency[match.groups.item];
                translated ? armor.push(translated) : null;
            }
        }
    }
    );
    result["weapons"] = weapons;
    result["armor"] = armor;

    return result;
}

function parseVision(vision) {
    const vis = [["nv", ""]];
    vision.map(x => {
        const v = lookup.vision[x];
        v ? vis.push([v, ""]) : null;
    }
    );

    return vis;
}

function parseLanguages(languages) {
    const builtin = [];
    const script = [];
    const custom = [];

    for (const l of languages) {
        if (lookup.language[l]) {
            builtin.push(lookup.language[l]);
            script.push(lookup.script[l]);
        } else {
            custom.push(l);
        }
    }

    const data =
    {
        "spoken": {
            "value": builtin,
            "custom": custom.join("; ")
        },
        "script": {
            "value": script,
            "custom": ""
        }
    }

    return data;
}

/***********************************************************************/
/* Loot */

// Get the component names and types of composite loot items
function getLootComponents(loot) {
    const elements = [];

    loot.childNodes.forEach(
        x => {
            if (x.nodeName === "RulesElement") {
                elements.push({
                    name: x.attributes.name.nodeValue,
                    type: x.attributes.type.nodeValue,
                    count: loot.attributes.count.value,
                    equipCount: loot.attributes["equip-count"].value
                });
            }
        }
    );

    return elements;
}

// Extract an id: loot element
function getLoot(doc) {
    const elements = [];

    doc.querySelectorAll("LootTally > loot").forEach(
        x => {
            if (x.getAttribute("count") !== "0") {
                elements.push(getLootComponents(x))
            }
        }
    );

    return elements;
}

// Split enhancement bonus from item name
function splitItemName(name) {
    const pos = name.search("[+]");
    const base = pos == -1 ? name : name.substring(0, pos).trim();
    const bonus = pos == -1 ? "" : name.substring(pos);

    return { "name": base, "bonus": bonus };
}

// Construct the name of a composite item
function composeItemName(item, baseFullName, enchantmentFullName) {
    let nameNoEnhancement; // Name without enhancement bonus
    let finalName;
    const split = splitItemName(enchantmentFullName);

    if (item.type === "weapon" && item.system.weaponType === "implement") {
        nameNoEnhancement = split.name.replace(/(Implement)|(Weapon)|(Dagger)|(Staff)|(Orb)|(Wand)|(Ki Focus)|(Totem)|(Symbol)|(Rod)|(Tome)/i, baseFullName);

        if (nameNoEnhancement == split.name) {
            finalName = nameNoEnhancement + " " + baseFullName + " " + split.bonus;
        } else {
            finalName = nameNoEnhancement + " " + split.bonus;
        }
    } else {
        nameNoEnhancement = split.name.replace(/(Armor)|(Weapon)|(Shield)/, baseFullName);

        if (nameNoEnhancement == split.name) {
            finalName = nameNoEnhancement + " " + baseFullName + " " + split.bonus;
        } else {
            finalName = nameNoEnhancement + " " + split.bonus;
        }
    }

    return finalName;
}

// Cleanup the CBuilder name (mostly relevant for consumables)
function makeItemPattern(itemName) {
    const pattern = itemName.replaceAll(/[\(\)]/g, "\\$&").replace(/heroic tier/, "Level ([1-9]|10)").replace(/paragon tier/, "Level (1[1-9]|20)").replace(/epic tier/, "Level (2[1-9]|30)").replace(/(lvl)|(Lvl)|(level)/, "Level");
    return new RegExp(pattern, "i");
}

// Remove parentheses from the item name
function makeShortItemPattern(itemName) {
    const pattern = itemName.replace(/ \([\s\S]*\)/, "")
    return new RegExp(pattern, "i");
}

// Import a CBuilder composite item (base item/magic item pair)
async function importCBMagicItem(actor, compositeItem, compendium, powersCompendium) {
    let itemBaseReference = await lookupItems(compendium, [compositeItem[0].name], lookup.equipment, "full");

    if (itemBaseReference.length === 0 && lookup.equipment[compositeItem[0].name]) {
        return false; // Break if item with lookup name not found
    }

    if (itemBaseReference.length === 0) {
        // Try with a cleaned name
        itemBaseReference = await lookupItems(compendium, [makeItemPattern(compositeItem[0].name)], {}, "pattern");
    }
    if (itemBaseReference.length === 0) {
        // Try with a short item name (no parentheses)
        itemBaseReference = await lookupItems(compendium, [makeShortItemPattern(compositeItem[0].name)], {}, "pattern");
    }
    if (itemBaseReference.length === 0) {
        // Base item not found
        return false;
    }

    let itemEnchantmentReference = [];
    let itemsBase = [];
    let itemsTemp = [];

    if (itemBaseReference.length > 0) {
        // Create the base item
        itemsBase = await actor.createEmbeddedDocuments("Item", [itemBaseReference[0]]);

        // Set the quantity
        await itemsBase[0].update({ "system.quantity": Number(compositeItem[0].count) });

        // Set equipped status
        if (Number(compositeItem[0].equipCount) > 0) {
            await itemsBase[0].update({ "system.equipped": true });
        } else {
            await itemsBase[0].update({ "system.equipped": false });
        }
    }

    if (itemsBase.length > 0 && compositeItem.length > 1) {
        // Modify the base if enchanted
        itemEnchantmentReference = await lookupItems(compendium, [compositeItem[1].name], lookup.equipment, "full", null, true);

        if (itemEnchantmentReference.length > 0) {
            // Make a temporary magic item
            itemsTemp = await actor.createEmbeddedDocuments("Item", [itemEnchantmentReference[0]]);

            // Merge base item and enchantment
            await mergeItems(itemsBase[0], itemsTemp[0]);

            // Remove the temporary item
            await actor.deleteEmbeddedDocuments("Item", [itemsTemp[0]["_id"]]);
        }
    }

    // Look for associated powers
    let itemPowers = [];

    if (itemEnchantmentReference.length > 0) { // Get powers from enchantment
        const powerName = itemEnchantmentReference[0].name.replace(/ \+\d/, "") + " Power";
        itemPowers = await lookupItems(powersCompendium, [powerName], lookup.power, "startOfStringMany", null);
        if (itemPowers.length === 0) { // Try without parentheses
            itemPowers = await lookupItems(powersCompendium, [powerName.replace(/ \([\s\S]*\)/, "")], lookup.power, "startOfStringMany", null);
        }
    } else if (itemBaseReference.length > 0) { // Get powers from base 
        const powerName = itemBaseReference[0].name.replace(/ \+\d/, "") + " Power";
        itemPowers = await lookupItems(powersCompendium, [powerName], lookup.power, "startOfStringMany", null);
        if (itemPowers.length === 0) { // Try without parentheses
            itemPowers = await lookupItems(powersCompendium, [powerName.replace(/ \([\s\S]*\)/, "")], lookup.power, "startOfStringMany", null);
        }
    }

    if (itemPowers.length > 0) {
        await actor.createEmbeddedDocuments("Item", itemPowers);
    }

    return true;
}

// Merge a base item and a magic item template
async function mergeItems(itemBase, itemEnchantment) {
    if (itemBase.type != itemEnchantment.type) {
        return;
    }

    const itemBaseName = itemBase.name;
    const type = itemBase.type;

    await itemBase.update({
        "name": composeItemName(itemBase, itemBase.name, itemEnchantment.name),
        "system.description.value": itemEnchantment.system.description.value,
        "system.price": itemEnchantment.system.price,
        "system.rarity": itemEnchantment.system.rarity,
        "system.level": itemEnchantment.system.level
    });

    if (type === "equipment") {
        const baseAC =
            lookupMasterworkAC(itemBaseName, itemEnchantment.system.level, itemBase.system.armour.ac);

        await itemBase.update({
            "system.armour.ac": baseAC,
            "system.armour.enhance": itemEnchantment.system.armour.enhance
        });
    } else if (type === "weapon") {
        await itemBase.update({
            "system.enhance": itemEnchantment.system.enhance,
            "system.critDamageForm": itemEnchantment.system.critDamageForm,
            "system.critDamageFormImp": itemEnchantment.system.critDamageImp,
        });
    }

    // Update item icon
    const genericIconPrefixes = [/^icons\/svg\//g];
    let enchantmentIsGeneric = false;
    let baseIsGeneric = false;

    for (const prefix of genericIconPrefixes) {
        if (itemEnchantment.img.match(prefix)) {
            enchantmentIsGeneric = true;
        }
        if (itemBase.img.match(prefix)) {
            baseIsGeneric = true;
        }
    }

    if (!enchantmentIsGeneric) {
        await itemBase.update({
            "img": itemEnchantment.img
        });
    } else if (!baseIsGeneric) {
        await itemBase.update({
            "img": itemBase.img.replace(".webp", "") + Math.ceil(Number(itemEnchantment.system.level) / 5) + ".webp"
        });
    }
}

// Build an item from names
async function buildMagicItem(baseName, enchantmentName) {
    if (baseName === "") {
        return ui.notifications.error("You did not specify a base item!");
    } else if (enchantmentName === "") {
        return ui.notifications.error("You did not specify a magic item template!");
    }

    ui.notifications.info("Building magic item. Please wait...");

    const compendium = game.packs.get(DnD4ECompendium.ID + ".module-equipment");
    const itemBaseReference = await lookupItems(compendium, [baseName], lookup.equipment, "full");
    const itemEnchantmentReference = await lookupItems(compendium, [enchantmentName], lookup.equipment, "full");

    if (itemBaseReference.length === 0) {
        return ui.notifications.error("Base item not found! Please use exact name.");
    } else if (itemEnchantmentReference.length === 0) {
        return ui.notifications.error("Magic item template not found! Please use exact name.");
    } else if (itemBaseReference[0].type != itemEnchantmentReference[0].type) {
        return ui.notifications.error("Item types do not match.");
    }

    const itemBase = await Item.create(itemBaseReference);
    const itemEnchantment = await Item.create(itemEnchantmentReference);

    await mergeItems(itemBase[0], itemEnchantment[0]);
    itemEnchantment[0].delete();

    ui.notifications.info("Magic item complete.");
}

/***********************************************************************/
/* Utility functions */

// Get a list of items from a compendium
async function lookupItems(compendium, names, nameLookup, matchType = "partial", postprocessor = null, verbose = false, classes = []) {
    const selection = {}; // Item references
    let items = []; // Item documents

    if (names.length > 0 && names[0]) {
        names.map(
            function (target) {
                let entry = {};

                // Check if an item is in the lookup table
                const name = nameLookup[target];

                if (name) {
                    entry = compendium.index.find(x => x.name === name);
                    if (!entry || Object.keys(entry).length === 0) {
                        return; // Break if item with lookup name is not found
                    }
                } else {
                    if (matchType === "full") {
                        entry = compendium.index.find(x => x.name === target);
                    } else if (matchType === "partial") {
                        const pattern = new RegExp(target.replaceAll(/[\(\)\[\]\+]/g, "\\$&"), "i");
                        entry = compendium.index.filter(x => x.name.match(pattern)).sort(itemSortOrderShortFirst)[0];
                    } else if (matchType === "power" && classes.length > 0) {
                        const pattern = new RegExp(target.replaceAll(/[\(\)\[\]\+]/g, "\\$&"), "i");
                        const matches = compendium.index.filter(x => x.name.match(pattern)).sort(powerSortOrderLongFirst);

                        // If there are multiple matches for a power, pick a hybrid version only if appropriate. Hybrid powers are listed first (longer names).
                        if (matches.length > 1) {
                            const classNames = classes.map(x => x.replace("Class", "").replace("Hybrid", "").trim());
                            if (classNames.length == 1) { // Not a hybrid character
                                entry = matches.filter(x => !x.name.match("Hybrid"))[0];
                            } else if (classNames.length > 1) { // Hybrid character
                                if (matches[0].name.match(classNames[0]) || matches[0].name.match(classNames[1])) {
                                    entry = matches[0]; // Power comes from a hybrid class
                                } else if (!matches[0].name.match("Hybrid")) { // Power does not come from a hybrid class. Perhaps multiclass.
                                    entry = matches[0];
                                } else {
                                    entry = matches[1]; // Power is hybrid, but not from the character's hybrid classes. Take the second match.
                                }
                            }
                        } else {
                            entry = matches[0];
                        }
                    } else if (matchType === "startOfStringMany") { // Return an array of matches that start with the target
                        const pattern = new RegExp("^" + target.replaceAll(/[\(\)\[\]\+]/g, "\\$&"), "i");
                        entry = compendium.index.filter(x => x.name.match(pattern)); // Array
                    } else if (matchType === "no_parentheses") {
                        const pattern = typeof target === "string" ? target.replace(/\(.*\)/, "").trim() : target;
                        entry = compendium.index.find(x => x.name === pattern);
                    } else if (matchType === "pattern") {
                        entry = compendium.index.filter(x => x.name.match(target)).sort(itemSortOrderShortFirst)[0];
                    }
                }

                // Fallback: Try normalized name
                if (!entry && typeof target === "string") {
                    const normalizedTarget = target.replace(/\s*\(.*?\)$/, "").trim();
                    const pattern = new RegExp(normalizedTarget.replaceAll(/[\(\)\[\]\+]/g, "\\$&"), "i");
                    entry = compendium.index.filter(x => x.name.match(pattern)).sort(itemSortOrderShortFirst)[0];
                }

                if (entry && Object.keys(entry).length > 0) {
                    selection[target] = entry;
                } else if (verbose) {
                    ui.notifications.error(target + " not found.");
                }
            }
        );

        const keys = Object.keys(selection);
        const ids = Object.values(selection).flat().map(x => x._id);

        items = await compendium.getDocuments({ _id__in: ids });

        // Sort items according to the ids array
        items = ids.map(id => items.find(item => item._id === id).clone());

        if (postprocessor) {
            for (let i = 0; i < items.length; i++) {
                items[i] = postprocessor(items[i], keys[i]);
            }
        }
    }

    return items;
}

// Rename an item
function renameItem(item, name) {
    item["name"] = name;
    item._source["name"] = name;
    return item;
}

// Set skill training
async function setSkills(actor, skills) {
    for (const x of skills) {
        const data = {};
        data["system.skills." + x + ".training"] = 5;

        await actor.update(data);
    }

    return actor;
}

// Read currency values
function parseMoney(str, wealth = null) {
    const currencies = wealth ?? { "ad": 0, "pp": 0, "gp": 0, "sp": 0, "cp": 0 };
    const currencyArray = str.replaceAll(",", "").split(";");

    for (const x of currencyArray) {
        const currency = x.trim().split(" ");
        currencies[currency[1]] += Number(currency[0]);
    }

    return currencies;
}

// Remove duplicates from an array
function removeDuplicates(a) {
    return [... new Set(a)];
}

// Sort powers by name and list primary powers first (e.g. Psion 01-Force Shard before Force Shard Attack)
function powerSortOrderLongFirst(a, b) {
    const ma = a.name.match(/-/); // Look for a dash to guess primary power (e.g. Psion[01]-Force Shard)
    const mb = b.name.match(/-/);

    if (ma && mb) {
        return b.name.length - a.name.length; // Longest first: heuristic for primary power if associate power contains a dash
    } else if (ma) {
        return -1; // Sort a before b
    } else if (mb) {
        return 1; // Sort b before a
    } else {
        return a.name.length - b.name.length; // If none of the powers contain a dash, sort the shortest one first
    }
}

function itemSortOrderShortFirst(a, b) {
    return a.name.length - b.name.length;
}