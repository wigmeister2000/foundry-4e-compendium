import { registerConfigurations } from "./config.js";
import { addCbuilderXMLImportButton } from "./tools/cbuilder_xml_import.js";
import { addActorContextMenuAdjustMonster, addActorContextMenuMM3Math, addActorContextMenuFindAndReplace, addFolderContextMenuAdjustMonster, addFolderContextMenuMM3Math, addActorContextMenuMonsterKnowledge, addFolderContextMenuMonsterKnowledge } from "./tools/adjust_monster.js";
import { addBuildEquipmentButton } from "./tools/cbuilder_xml_import.js";
import { createHPchangeMessage, createSurgeChangeMessage, createResourceChangeMessage } from "./tools/chat-messages.js";
import { createEffectsMessageCombat, createEffectsMessageSelected } from "./tools/effect-chat-messages.js";
import { encounterDifficultyDialogue } from "./tools/encounter_difficulty.js";
import { addActorContextMenuImportConfig, addActorContextMenuCopyID } from "./tools/actor-import-config.js";
import { makeEncounterMessage, randomEncounter, substituteElite, substituteMinions, substituteSolo, substituteTrap } from "./tools/encounter_generator.js";

Hooks.once("init", function () {
    DnD4ECompendium.initialize();
    registerConfigurations();
    DnD4ECompendium.registerHotKeys();
    DnD4ECompendium.registerAPI();
});

export class DnD4ECompendium {
    static ID = "dnd-4e-compendium";
    static NAME = "DnD 4e Compendium";

    static SETTINGS = {
        CBUILDER_IMPORT: "cbuilder-import",
        BUILD_MAGIC_ITEM: "build-magic-item",
        MONSTER_ADJUSTMENT: "monster-adjustment",
        FIND_AND_REPLACE: "actor-find-and-replace",
        IMPORT_CONFIG: "actor-import-config",
        HP_MESSAGES: "hp-messages",
        SURGE_MESSAGES: "surge-messages",
        RESOURCE_MESSAGES: "resource-messages",
        CONDITION_MESSAGES: "condition-messages",
        ENCOUNTER_DIFFICULTY: "encounter-difficulty",
        APPEND_DURATION: "append-duration"
    }

    static initialize() {
        console.log(this.NAME + " | Initialising the DnD 4e compendium.");
        Hooks.on("renderSidebarTab", addCbuilderXMLImportButton);
        Hooks.on("renderSidebarTab", addBuildEquipmentButton);
        Hooks.on("getActorDirectoryEntryContext", addActorContextMenuCopyID);
        Hooks.on("getActorDirectoryEntryContext", addActorContextMenuImportConfig);
        Hooks.on("getActorDirectoryEntryContext", addActorContextMenuAdjustMonster);
        Hooks.on("getActorDirectoryEntryContext", addActorContextMenuMM3Math);
        Hooks.on("getActorDirectoryEntryContext", addActorContextMenuMonsterKnowledge);
        Hooks.on("getActorDirectoryEntryContext", addActorContextMenuFindAndReplace);
        Hooks.on("getActorDirectoryFolderContext", addFolderContextMenuAdjustMonster);
        Hooks.on("getActorDirectoryFolderContext", addFolderContextMenuMM3Math);
        Hooks.on("getActorDirectoryFolderContext", addFolderContextMenuMonsterKnowledge);
        Hooks.on("preUpdateActor", createHPchangeMessage);
        Hooks.on("preUpdateActor", createSurgeChangeMessage);
        Hooks.on("preUpdateActor", createResourceChangeMessage);
        Hooks.on("combatStart", createEffectsMessageCombat);
        Hooks.on("combatRound", createEffectsMessageCombat);
        Hooks.on("combatTurn", createEffectsMessageCombat);
    }

    static registerAPI() {
        game.modules.get(DnD4ECompendium.ID).api = {};
        game.modules.get(DnD4ECompendium.ID).api.randomEncounter = randomEncounter;
        game.modules.get(DnD4ECompendium.ID).api.substituteMinions = substituteMinions;
        game.modules.get(DnD4ECompendium.ID).api.substituteElite = substituteElite;
        game.modules.get(DnD4ECompendium.ID).api.substituteSolo = substituteSolo;
        game.modules.get(DnD4ECompendium.ID).api.substituteTrap = substituteTrap;
        game.modules.get(DnD4ECompendium.ID).api.makeEncounterMessage = makeEncounterMessage;
    }

    static registerHotKeys() {
        game.keybindings.register(DnD4ECompendium.ID, "chat-effects-key", {
            name: `4ECOMPENDIUM.keybindings.${DnD4ECompendium.SETTINGS.CONDITION_MESSAGES}.Name`,
            hint: `4ECOMPENDIUM.keybindings.${DnD4ECompendium.SETTINGS.CONDITION_MESSAGES}.Hint`,
            editable: [{
                key: "KeyQ",
                modifiers: ["Shift"]
            }],
            restricted: true,
            onUp: () => createEffectsMessageSelected()
        });

        game.keybindings.register(DnD4ECompendium.ID, "chat-encounter-difficulty-key", {
            name: `4ECOMPENDIUM.keybindings.${DnD4ECompendium.SETTINGS.ENCOUNTER_DIFFICULTY}.Name`,
            hint: `4ECOMPENDIUM.keybindings.${DnD4ECompendium.SETTINGS.ENCOUNTER_DIFFICULTY}.Hint`,
            editable: [{
                key: "KeyG",
                modifiers: ["Shift"]
            }],
            restricted: true,
            onUp: () => encounterDifficultyDialogue()
        });
    }
}
