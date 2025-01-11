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
}

export async function createResourceChangeMessage(actor, change, options, userId) {
    if (game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.RESOURCE_MESSAGES)) {
        if (actor.type === "Player Character" || (actor.type === "NPC" && actor.isToken && !actor.token.hidden)) {
            const name = actor.name;

            let diffResource1 = 0;
            let diffResource2 = 0;
            let diffResource3 = 0;

            switch (true) {
                case change.system?.resources?.hasOwnProperty("primary"):
                    const newResource1 = change.system.resources.primary.value;
                    const oldResource1 = actor.system.resources.primary.value;
                    diffResource1 = newResource1 - oldResource1;
                case change.system?.resources?.hasOwnProperty("secondary"):
                    const newResource2 = change.system.resources.secondary.value;
                    const oldResource2 = actor.system.resources.secondary.value;
                    diffResource2 = newResource2 - oldResource2;
                case change.system?.resources?.hasOwnProperty("tertiary"):
                    const newResource3 = change.system.resources.tertiary.value;
                    const oldResource3 = actor.system.resources.tertiary.value;
                    diffResource3 = newResource3 - oldResource3;
            }


            let message = `<b>${name}</b>`;
            const label1 = actor.system.resources.primary.label != "" ? actor.system.resources.primary.label : actor.system.resources.primary.placeholder;
            const label2 = actor.system.resources.secondary.label != "" ? actor.system.resources.secondary.label : actor.system.resources.secondary.placeholder;
            const label3 = actor.system.resources.tertiary.label != "" ? actor.system.resources.tertiary.label : actor.system.resources.tertiary.placeholder;

            if (diffResource1 > 0) {
                message += `<p>+${diffResource1} ` + label1 + " point(s)</p>";
            }
            else if (diffResource1 < 0) {
                message += `<p>-${Math.abs(diffResource1)} ` + label1 + " point(s)</p>";
            }
            
            if (diffResource2 > 0) {
                message += `<p>+${diffResource2} ` + label2 + " point(s)</p>";
            }
            else if (diffResource2 < 0) {
                message += `<p>-${Math.abs(diffResource2)} ` + label2 + " point(s)</p>";
            }

            if (diffResource3 > 0) {
                message += `<p>+${diffResource3} ` + label3 + " point(s)</p>";
            }
            else if (diffResource3 < 0) {
                message += `<p>-${Math.abs(diffResource3)} ` + label3 + " point(s)</p>";
            }

            if (diffResource1 || diffResource2 || diffResource3) {
                await createMessage(message);
            }
        }
    }
}