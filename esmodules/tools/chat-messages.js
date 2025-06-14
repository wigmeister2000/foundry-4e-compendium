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
        if (actor.type === "Player Character" || (actor.type === "NPC" && actor.isToken && !actor.token.hidden)) {
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

            let message = `<strong>${name}</strong>`;

            if (diffTempHP > 0) {
                message += `<br>+${diffTempHP} Temp HP`;
            }
            else if (diffTempHP < 0) {
                message += `<br>-${Math.abs(diffTempHP)} Temp HP`;
            }

            if (diffHP > 0) {
                message += `<br>+${diffHP} HP`;
            }
            else if (diffHP < 0) {
                message += `<br>-${Math.abs(diffHP)} HP`;
            }

            if (diffHP || diffTempHP) {
                await createMessage(message);
            }
        }
    }
}

export async function createSurgeChangeMessage(actor, change, options, userId) {
    if (game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.SURGE_MESSAGES)) {
        if (actor.type === "Player Character" || (actor.type === "NPC" && actor.isToken && !actor.token.hidden)) {
            const name = actor.name;

            let diffSurges = 0;

            if (change.system?.details?.surges?.hasOwnProperty("value")) {
                const newSurges = change.system.details.surges.value;
                const oldSurges = actor.system.details.surges.value;
                diffSurges = newSurges - oldSurges;
            }

            let message = `<strong>${name}</strong>`;

            if (diffSurges > 0) {
                message += `<br>+${diffSurges} healing surge(s)`;
            }
            else if (diffSurges < 0) {
                message += `<br>-${Math.abs(diffSurges)} healing surge(s)`;
            }

            if (diffSurges) {
                await createMessage(message);
            }
        }
    }
}

export async function createResourceChangeMessage(actor, change, options, userId) {
    if (game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.RESOURCE_MESSAGES)) {
        if (actor.type === "Player Character" || (actor.type === "NPC" && actor.isToken && !actor.token.hidden)) {
            const name = actor.name;

            let diffResource1 = 0;
            let diffResource2 = 0;
            let diffResource3 = 0;

            if (change.system?.resources?.hasOwnProperty("primary")) {
                const newResource1 = change.system.resources.primary.value;
                const oldResource1 = actor.system.resources.primary.value;
                diffResource1 = newResource1 - oldResource1;
            }
            if (change.system?.resources?.hasOwnProperty("secondary")) {
                const newResource2 = change.system.resources.secondary.value;
                const oldResource2 = actor.system.resources.secondary.value;
                diffResource2 = newResource2 - oldResource2;
            }
            if (change.system?.resources?.hasOwnProperty("tertiary")) {
                const newResource3 = change.system.resources.tertiary.value;
                const oldResource3 = actor.system.resources.tertiary.value;
                diffResource3 = newResource3 - oldResource3;
            }


            let message = `<strong>${name}</strong>`;
            const label1 = actor.system.resources.primary.label != "" ? actor.system.resources.primary.label : actor.system.resources.primary.placeholder;
            const label2 = actor.system.resources.secondary.label != "" ? actor.system.resources.secondary.label : actor.system.resources.secondary.placeholder;
            const label3 = actor.system.resources.tertiary.label != "" ? actor.system.resources.tertiary.label : actor.system.resources.tertiary.placeholder;

            if (diffResource1 > 0) {
                message += `<br>+${diffResource1} ` + label1;
            }
            else if (diffResource1 < 0) {
                message += `<br>-${Math.abs(diffResource1)} ` + label1;
            }

            if (diffResource2 > 0) {
                message += `<br>+${diffResource2} ` + label2;
            }
            else if (diffResource2 < 0) {
                message += `<br>-${Math.abs(diffResource2)} ` + label2;
            }

            if (diffResource3 > 0) {
                message += `<br>+${diffResource3} ` + label3;
            }
            else if (diffResource3 < 0) {
                message += `<br>-${Math.abs(diffResource3)} ` + label3;
            }

            if (diffResource1 || diffResource2 || diffResource3) {
                await createMessage(message);
            }
        }
    }
}