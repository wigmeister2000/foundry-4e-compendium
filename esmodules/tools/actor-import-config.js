import { DnD4ECompendium } from "../dnd-4e-compendium.js";

/***********************************************************************/
/* Context menu extensions */

export function addActorContextMenuImportConfig(app, menuItems) {
    if (game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.IMPORT_CONFIG)) {
        menuItems.push({
            name: game.i18n.localize("4ECOMPENDIUM.context.actor-import-config"),
            condition: target => {
                const id = target.dataset.entryId;
                const actor = game.actors.get(id);
                return game.user.hasPermission("ACTOR_CREATE") && ["NPC", "Player Character"].includes(actor?.type);
            },
            icon: '<i class="fas fa-arrow-right-to-bracket"></i>',
            callback: target => {
                const id = target.dataset.entryId;
                const actor = game.actors.get(id);
                importConfigDialog(actor);
            }
        })
    }
}

export function addActorContextMenuCopyID(app, menuItems) {
    if (game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.IMPORT_CONFIG)) {
        menuItems.push({
            name: game.i18n.localize("4ECOMPENDIUM.context.actor-copy-id"),
            condition: target => {
                const id = target.dataset.entryId;
                const actor = game.actors.get(id);
                return game.user.hasPermission("ACTOR_CREATE") && ["NPC", "Player Character"].includes(actor?.type);
            },
            icon: '<i class="fas fa-passport"></i>',
            callback: target => {
                const id = target.dataset.entryId;
                game.clipboard.copyPlainText(id);
            }
        })
    }
}

/***********************************************************************/
/* Dialogs */

async function importConfigDialog(actor) {
    new Dialog({
        title: game.i18n.localize("4ECOMPENDIUM.actor-import-config.title"),
        content: await renderTemplate("modules/" + DnD4ECompendium.ID + "/templates/actor-import-config.hbs",
            {
                hint1: game.i18n.localize("4ECOMPENDIUM.actor-import-config.hint1")
            }),
        buttons: {
            import: {
                icon: '<i class="fas fa-right-arrow-to-bracket"></i>',
                label: "Import",
                callback: html => {
                    const target = html.find("input[name='target']");
                    const config = {};
                    config.appearance = html.find("input[name='appearance']")[0].checked;
                    config.images = html.find("input[name='images']")[0].checked;
                    config.descriptions = html.find("input[name='descriptions']")[0].checked;
                    config.data = html.find("input[name='data']")[0].checked;
                    config.effects = html.find("input[name='effects']")[0].checked;
                    config.macros = html.find("input[name='macros']")[0].checked;
                    config.overwrite = html.find("input[name='overwrite']")[0].checked;
                    importConfig(actor, target.val(), config);
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

/***********************************************************************/
/* Transfer functions */

async function cloneEffects(source, target, overwrite) {
    if (source.type != target.type) {
        return;
    }

    // Clone effects
    const effectsSource = source.effects;
    const effectsTarget = target.effects;
    let effectNamesSource = effectsSource.contents.map(effect => effect.name);
    let effectNamesTarget = effectsTarget.contents.map(effect => effect.name);
    const effectsToClone = [];

    if (overwrite) { // Remove existing duplicates
        for (const effect of effectsTarget) {
            if (effectNamesSource.includes(effect.name)) {
                await effect.delete();
            }
        }
        effectNamesTarget = effectsTarget.contents.map(effect => effect.name); // Refresh names
    }

    effectsSource.contents.forEach(effect => {
        if (!effectNamesTarget.includes(effect.name)) {
            effectsToClone.push(effect);
        }
    });

    await target.createEmbeddedDocuments("ActiveEffect", effectsToClone);
}

async function cloneMacro(source, target) {
    if (source.type != target.type) {
        return;
    }

    await target.update({ "system.macro": source.system.macro });
}

async function cloneImage(source, target) {
    await target.update({
        "img": source.img
    });
}

async function cloneAppearance(source, target) {
    await target.update({
        "img": source.img,
        "prototypeToken": source.prototypeToken
    });
}

async function cloneSystemData(source, target) {
    const system = foundry.utils.deepClone(source.system);
    delete system.description;
    delete system.macro;
    await target.update({ "system": system });
}

async function cloneDescription(source, target) {
    await target.update({ "system.description": source.system.description });
}

async function importConfig(actor, sourceID, config = {}) {
    const sourceActor = Actor.get(sourceID);

    if (!sourceActor || !["Player Character", "NPC"].includes(sourceActor.type)) {
        return ui.notifications.error("Actor with the specified ID does not exist.");
    }

    // Actor
    if (config.appearance) {
        await cloneAppearance(sourceActor, actor);
    }
    if (config.effects) {
        await cloneEffects(sourceActor, actor, config.overwrite);
    }

    await actor.update({ "system.biography": sourceActor.system.biography });

    // Items
    const itemsSource = sourceActor.items.contents;
    const itemsTarget = actor.items.contents;

    for (const source of itemsSource) {
        const targets = itemsTarget.filter(t => t.name === source.name);
        if (targets.length > 0) {
            for (const t of targets) {
                if (config.effects) {
                    await cloneEffects(source, t, config.overwrite);
                }
                if (config.macros) {
                    await cloneMacro(source, t);
                }
                if (config.images) {
                    await cloneImage(source, t);
                }
                if (config.data) {
                    await cloneSystemData(source, t);
                }
                if (config.descriptions) {
                    await cloneDescription(source, t);
                }
            }
        }
    }
}
