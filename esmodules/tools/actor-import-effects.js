import { DnD4ECompendium } from "../dnd-4e-compendium.js";

/***********************************************************************/
/* Context menu extensions */

export function addActorContextMenuImportEffects(html, entryOptions) {
    if (game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.IMPORT_EFFECTS)) {
        entryOptions.push({
            name: game.i18n.localize("4ECOMPENDIUM.context.actor-import-effects"),
            condition: target => {
                const id = target.attr("data-document-id");
                const actor = game.actors.get(id);
                return game.user.hasPermission("ACTOR_CREATE") && ["NPC", "Player Character"].includes(actor?.type);
            },
            icon: '<i class="fas fa-arrow-right-to-bracket"></i>',
            callback: target => {
                const id = target.attr("data-document-id");
                const actor = game.actors.get(id);
                cloneEffectsDialog(actor);
            }
        })
    }
}

export function addActorContextMenuCopyID(html, entryOptions) {
    if (game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.IMPORT_EFFECTS)) {
        entryOptions.push({
            name: game.i18n.localize("4ECOMPENDIUM.context.actor-copy-id"),
            condition: target => {
                const id = target.attr("data-document-id");
                const actor = game.actors.get(id);
                return game.user.hasPermission("ACTOR_CREATE") && ["NPC", "Player Character"].includes(actor?.type);
            },
            icon: '<i class="fas fa-passport"></i>',
            callback: target => {
                const id = target.attr("data-document-id");
                game.clipboard.copyPlainText(id);
            }
        })
    }
}

/***********************************************************************/
/* Dialogs */

async function cloneEffectsDialog(actor) {
    new Dialog({
        title: game.i18n.localize("4ECOMPENDIUM.actor-import-effects.title"),
        content: await renderTemplate("modules/" + DnD4ECompendium.ID + "/templates/actor-import-effects.hbs",
            {
                hint1: game.i18n.localize("4ECOMPENDIUM.actor-import-effects.hint1")
            }),
        buttons: {
            clone: {
                icon: '<i class="fas fa-right-arrow-to-bracket"></i>',
                label: "Import Effects",
                callback: html => {
                    const target = html.find("input[name='target']");
                    const macros = html.find("input[name='macros']")[0].checked;
                    const overwrite = html.find("input[name='overwrite']")[0].checked;
                    cloneAllEffects(actor, target.val(), overwrite, macros);
                }
            },
            no: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel"
            }
        },
        default: "clone"
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

async function cloneMacros(source, target) {
    if (source.type != target.type) {
        return;
    }

    await target.update({ "system.macro": source.system.macro });
}

async function cloneAllEffects(actor, targetID, overwrite, macros) {
    const sourceActor = Actor.get(targetID);

    if (!sourceActor || !["Player Character", "NPC"].includes(sourceActor.type)) {
        return ui.notifications.error("Actor with the specified ID does not exist.");
    }

    // Clone effects of actor
    await cloneEffects(sourceActor, actor, overwrite);

    // Clone effects and macros of items
    const itemsSource = sourceActor.items.contents;
    const itemsTarget = actor.items.contents;

    for (const source of itemsSource) {
        const targets = itemsTarget.filter(t => t.name === source.name);
        if (targets.length > 0) {
            for (const t of targets) {
                await cloneEffects(source, t, overwrite);
                if (macros) {
                    await cloneMacros(source, t);
                }
            }
        }
    }
}
