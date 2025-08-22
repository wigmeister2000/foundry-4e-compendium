import { treasureParcels } from "./treasure_parcels.js";

export async function rollOnTreasureTable(level, type) {

    const encodeType = { "gold": 0, "gems": 1, "art": 2, "item": 3 };
    const decodeType = { 0: "gold", 1: "gems", 2: "art", 3: "item" };

    let typecode = typeof type === "string" ? encodeType[type] : type;

    const r1 = new Roll("d20");
    await r1.evaluate();

    if (game.modules.get("dice-so-nice")?.active) {
        game.dice3d.showForRoll(r1);
    }

    const treasure = treasureParcels[level][typecode][String(r1.total)];
    const result = {};

    if (treasure) {
        if (typecode < 3) {
            const r2 = new Roll(treasure[1]);
            await r2.evaluate();

            if (game.modules.get("dice-so-nice")?.active) {
                game.dice3d.showForRoll(r2);
            }

            result["type"] = decodeType[typecode];
            result["count"] = r2.total;
            result["value"] = treasure[2];
        } else if (type == 3) {
            const r2 = new Roll(treasure[2]);
            await r2.evaluate();

            if (game.modules.get("dice-so-nice")?.active) {
                game.dice3d.showForRoll(r2);
            }

            result["type"] = decodeType[typecode];
            result["count"] = Number(treasure[1]);
            result["level"] = r2.total;
            result["rarity"] = r1.total == 20 ? "rare" : ["uncommon", "common"][r1.total % 2];
        }
    }

    return result;
}