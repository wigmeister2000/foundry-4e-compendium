import { DnD4ECompendium } from "../dnd-4e-compendium.js";
import { lookup } from "./lookup_tables.js";

async function createMessage(message) {
    return ChatMessage.create({
        user: game.user._id,
        speaker: game.user.name,
        content: message
    });
}

function makeDurationString(strings, user, round) {
    const prefix = strings[0]; // "Until start/end of "
    const suffix = strings[1]; // "'s (next) turn"
    let durationString = "";

    if (user && round) {
        durationString = `${prefix}${user}${suffix}, Round ${round}`;
    } else if (user) {
        durationString = `${prefix}${user}${suffix}`;
    }

    return durationString;
}

async function createEffectLine(effect, appendDuration = false) {
    let name = effect.name;
    const durationType = effect.flags.dnd4e?.effectData?.durationType;
    const round = effect.duration.rounds;
    const effectOrigin = await fromUuid(effect.origin);

    if (appendDuration && durationType) {
        if (effectOrigin && ["endOfUserTurn", "startOfUserTurn"].includes(durationType)) {
            name = name + " (" + makeDurationString(lookup.durationTemplates[durationType], effectOrigin.name, round) + ")";
        } else if (effectOrigin && ["endOfTargetTurn", "startOfTargetTurn"].includes(durationType)) {
            name = name + " (" + makeDurationString(lookup.durationTemplates[durationType], effect.parent.name, round) + ")";
        } else if (lookup.durations[durationType]) {
            name = name + " (" + lookup.durations[durationType] + ")";
        }
    }

    return `<tr><td style="padding-right:15px;width:45px"><img src="${effect.icon}" width="30" style="vertical-align:middle;background-color:black;background-blend-mode:normal"></td><td style="text-align:left">${name}</td></tr>`;
}

function temporaryQ(effect) {
    const durationType = effect.flags.dnd4e?.effectData?.durationType;

    if (durationType && !effect.disabled) {
        return !!durationType;
    }

    return effect.isTemporary && !effect.disabled;
}

export async function createEffectsMessageCombat(combat, state, time) {
    if (game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.CONDITION_MESSAGES)) {
        const appendDuration = game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.APPEND_DURATION);

        const token = canvas.tokens.get(combat.turns[state.turn].tokenId);
        const name = token.document.name;
        const effects = token.document.actorLink ? Actor.get(token.document.actorId).effects.map(x => x)?.filter(x => temporaryQ(x)) : token.document.actor.effects?.filter(x => !x.disabled);
        if (effects?.length > 0) {
            const header = `<p><b>Round</b> ${state.round}</p><p><b>${name}</b> has the following temporary effects:</p>`;

            const effectLines = [];

            for (const e of effects) {
                const line = await createEffectLine(e, appendDuration);
                effectLines.push(line);
            }

            const message = header + '<table>' + effectLines.join("") + "</table>";
            await createMessage(message);
        } else {
            await createMessage(`<p><b>Round</b> ${state.round}</p><p><b>${name}</b> has no temporary effects.</p>`);
        }
    }
}

export async function createEffectsMessageSelected() {
    const appendDuration = game.settings.get(DnD4ECompendium.ID, DnD4ECompendium.SETTINGS.APPEND_DURATION);
    const tokens = canvas.tokens.controlled;
    const messageParts = [];

    if (tokens?.length > 0) {
        for (const token of tokens) {
            const name = token.document.name;
            const effects = token.document.actorLink ? Actor.get(token.document.actorId).effects.map(x => x)?.filter(x => temporaryQ(x)) : token.document.actor.effects?.filter(x => !x.disabled);

            if (effects && effects.length > 0) {
                const header = `<p><b>${name}</b> has the following temporary effects:</p>`;

                const effectsLines = [];

                for (const e of effects) {
                    const line = await createEffectLine(e, appendDuration);
                    effectsLines.push(line);
                }

                const message = header + '<table>' + effectsLines.join("") + "</table>";
                messageParts.push(message);
            } else {
                messageParts.push(`<p><b>${name}</b> has no temporary effects.</p>`);
            }
        }

        await createMessage(messageParts.join(""));
    }
}