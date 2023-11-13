import { DnD4ECompendium } from "../dnd-4e-compendium.js";

async function createMessage(message) {
    return ChatMessage.create({
        user: game.user._id,
        speaker: game.user.name,
        content: message
    });
}

export async function createHPchangeMessage(actor, change, options, userId) {
    if (game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.HP_MESSAGES)) {
        const name = actor.name;

        let diffHP = 0;
        let diffTempHP = 0;

        if (change.system?.attributes?.hp?.hasOwnProperty("value")) {
            const newHP = change.system.attributes.hp.value;
            const oldHP = actor.system.attributes.hp.value;
            diffHP = newHP - oldHP;
        }

        if (change.system?.attributes?.temphp?.hasOwnProperty("value")) {
            const newTempHP = change.system.attributes.temphp.value;
            const oldTempHP = actor.system.attributes.temphp.value;
            diffTempHP = newTempHP - oldTempHP;
        }

        let message = `<b>${name}</b>`;

        if (diffTempHP > 0) {
            message += `<p>+${diffTempHP} Temp HP</p>`;
        }
        else if (diffTempHP < 0) {
            message += `<p>-${Math.abs(diffTempHP)} Temp HP</p>`;
        }

        if (diffHP > 0) {
            message += `<p>+${diffHP} HP</p>`;
        }
        else if (diffHP < 0) {
            message += `<p>-${Math.abs(diffHP)} HP</p>`;
        }

        if (diffHP || diffTempHP) {
            await createMessage(message);
        }
    }
}

export async function createSurgeChangeMessage(actor, change, options, userId) {
    if (game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.SURGE_MESSAGES)) {
        const name = actor.name;

        let diffSurges = 0;

        if (change.system?.details?.surges?.hasOwnProperty("value")) {
            const newSurges = change.system.details.surges.value;
            const oldSurges = actor.system.details.surges.value;
            diffSurges = newSurges - oldSurges;
        }

        let message = `<b>${name}</b>`;

        if (diffSurges > 0) {
            message += `<p>+${diffSurges} healing surge(s)</p>`;
        }
        else if (diffSurges < 0) {
            message += `<p>-${Math.abs(diffSurges)} healing surge(s)</p>`;
        }

        if (diffSurges) {
            await createMessage(message);
        }
    }
}