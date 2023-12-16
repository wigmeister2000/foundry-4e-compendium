import { DnD4ECompendium } from "./dnd-4e-compendium.js";

export function registerConfigurations() {
    game.settings.register(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.CBUILDER_IMPORT, {
        name: `4ECOMPENDIUM.settings.${DnD4ECompendium.SETTINGS.CBUILDER_IMPORT}.Name`,
        default: true,
        type: Boolean,
        scope: 'world',
        config: true,
        hint: `4ECOMPENDIUM.settings.${DnD4ECompendium.SETTINGS.CBUILDER_IMPORT}.Hint`,
        onChange: debouncedReload
    });

    game.settings.register(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.BUILD_MAGIC_ITEM, {
        name: `4ECOMPENDIUM.settings.${DnD4ECompendium.SETTINGS.BUILD_MAGIC_ITEM}.Name`,
        default: true,
        type: Boolean,
        scope: 'world',
        config: true,
        hint: `4ECOMPENDIUM.settings.${DnD4ECompendium.SETTINGS.BUILD_MAGIC_ITEM}.Hint`,
        onChange: debouncedReload
    });

    game.settings.register(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.MONSTER_ADJUSTMENT, {
        name: `4ECOMPENDIUM.settings.${DnD4ECompendium.SETTINGS.MONSTER_ADJUSTMENT}.Name`,
        default: true,
        type: Boolean,
        scope: 'world',
        config: true,
        hint: `4ECOMPENDIUM.settings.${DnD4ECompendium.SETTINGS.MONSTER_ADJUSTMENT}.Hint`,
        onChange: debouncedReload
    });

    game.settings.register(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.FIND_AND_REPLACE, {
        name: `4ECOMPENDIUM.settings.${DnD4ECompendium.SETTINGS.FIND_AND_REPLACE}.Name`,
        default: true,
        type: Boolean,
        scope: 'world',
        config: true,
        hint: `4ECOMPENDIUM.settings.${DnD4ECompendium.SETTINGS.FIND_AND_REPLACE}.Hint`,
        onChange: debouncedReload
    });

    game.settings.register(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.IMPORT_EFFECTS, {
        name: `4ECOMPENDIUM.settings.${DnD4ECompendium.SETTINGS.IMPORT_EFFECTS}.Name`,
        default: true,
        type: Boolean,
        scope: 'world',
        config: true,
        hint: `4ECOMPENDIUM.settings.${DnD4ECompendium.SETTINGS.IMPORT_EFFECTS}.Hint`,
        onChange: debouncedReload
    });


    game.settings.register(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.HP_MESSAGES, {
        name: `4ECOMPENDIUM.settings.${DnD4ECompendium.SETTINGS.HP_MESSAGES}.Name`,
        default: false,
        type: Boolean,
        scope: 'world',
        config: true,
        hint: `4ECOMPENDIUM.settings.${DnD4ECompendium.SETTINGS.HP_MESSAGES}.Hint`
    });

    game.settings.register(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.SURGE_MESSAGES, {
        name: `4ECOMPENDIUM.settings.${DnD4ECompendium.SETTINGS.SURGE_MESSAGES}.Name`,
        default: false,
        type: Boolean,
        scope: 'world',
        config: true,
        hint: `4ECOMPENDIUM.settings.${DnD4ECompendium.SETTINGS.SURGE_MESSAGES}.Hint`
    });

    game.settings.register(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.CONDITION_MESSAGES, {
        name: `4ECOMPENDIUM.settings.${DnD4ECompendium.SETTINGS.CONDITION_MESSAGES}.Name`,
        default: false,
        type: Boolean,
        scope: 'world',
        config: true,
        hint: `4ECOMPENDIUM.settings.${DnD4ECompendium.SETTINGS.CONDITION_MESSAGES}.Hint`
    });

    game.settings.register(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.APPEND_DURATION, {
        name: `4ECOMPENDIUM.settings.${DnD4ECompendium.SETTINGS.APPEND_DURATION}.Name`,
        default: false,
        type: Boolean,
        scope: 'world',
        config: true,
        hint: `4ECOMPENDIUM.settings.${DnD4ECompendium.SETTINGS.APPEND_DURATION}.Hint`
    });
}