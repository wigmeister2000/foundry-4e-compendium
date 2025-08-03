import { DnD4ECompendium } from "../dnd-4e-compendium.js";
import { lookup } from "./lookup_tables.js";
import { createPrivateMessage } from "./utility.js";

export async function encounterDifficultyDialogue() {
    new Dialog({
        title: game.i18n.localize("4ECOMPENDIUM.encounter-difficulty.title"),
        content: await renderTemplate("modules/" + DnD4ECompendium.ID + "/templates/encounter-difficulty.hbs", {
        }),
        buttons: {
            build: {
                icon: '<i class="fas fa-check"></i>',
                label: "OK",
                callback: html => {
                    const characters = html.find("input[name='characters']");
                    const partyLevel = html.find("input[name='partyLevel']");
                    encounterSummarySelected(Number(characters.val()), Number(partyLevel.val()));
                }
            },
            no: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel"
            }
        },
        default: "OK"
    }, {
        width: 400
    }).render(true);
}

// Print a summary of encounter difficulty for the selected monsters 
async function encounterSummarySelected(characters, partyLevel) {
    if (characters < 1 || !Number.isInteger(characters)) {
        return ui.notifications.error("Number of characters: Please enter a positive integer number.");
    } else if (partyLevel < 1 || partyLevel > 30 || !Number.isInteger(partyLevel)) {
        return ui.notifications.error("Party level: Please enter a positive interger number between 1 and 30.");
    }

    const tokens = canvas.tokens.controlled;

    let totalXP = 0;
    let encounterLevel = 0;
    let difficulty = 0;
    const difficultyTable = ["Trivial", "Easy", "Standard", "Hard", "Extreme"];
    let decrease = 0;
    let increase = 0;

    for (const token of tokens) {
        const name = token.document.name;
        const xp = token.document.actorLink ? Actor.get(token.document.actorId).system.details.exp : token.document.actor.system.details.exp;
        totalXP += xp;
    }

    while (lookup.encounterXP[encounterLevel] <= Math.floor(totalXP / characters)) { encounterLevel++ }
    encounterLevel--;

    const levelDiff = encounterLevel - partyLevel;

    if (levelDiff < -2) {
        difficulty = 0; // Trivial
        increase = characters * lookup.encounterXP[partyLevel - 2] - totalXP;
    } else if (-2 <= levelDiff && levelDiff <= -1) {
        difficulty = 1; // Easy
        decrease = partyLevel >= 3 ? totalXP - characters * lookup.encounterXP[partyLevel - 3] : 0;
        increase = characters * lookup.encounterXP[partyLevel] - totalXP;
    } else if (0 <= levelDiff && levelDiff <= 1) {
        difficulty = 2; // Standard
        decrease = partyLevel >= 2 ? totalXP - characters * lookup.encounterXP[partyLevel - 1] : 0;
        increase = characters * lookup.encounterXP[partyLevel + 2] - totalXP;
    } else if (2 <= levelDiff && levelDiff <= 4) {
        difficulty = 3; // Hard
        decrease = totalXP - characters * lookup.encounterXP[partyLevel + 1];
        increase = characters * lookup.encounterXP[partyLevel + 5] - totalXP;
    } else {
        difficulty = 4; // Extreme
        decrease = totalXP - characters * lookup.encounterXP[partyLevel + 4];
    }

    const decreaseMessage = decrease ? `Remove <strong>${decrease} XP</strong> to make it ${difficultyTable[difficulty - 1].toLowerCase()}.<br>` : "";
    const increaseMessage = increase ? `Add <strong>${increase} XP</strong> to make it ${difficultyTable[difficulty + 1].toLowerCase()}.<br>` : "";

    await createPrivateMessage(
        `<strong>Encounter Level</strong>: ${encounterLevel}<br>
        <strong>XP</strong>: ${totalXP} (${Math.floor(totalXP / characters)} XP per character)<br>
        <strong>Difficulty</strong>: ${difficultyTable[difficulty]}<br>
        ` + decreaseMessage + increaseMessage
    );
}