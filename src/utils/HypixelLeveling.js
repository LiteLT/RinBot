const HypixelConstants = {
    BASE: 10000,
    GROWTH: 2500
};

HypixelConstants.HALF_GROWTH = 0.5 * HypixelConstants.GROWTH;
HypixelConstants.REVERSE_PQ_PREFIX = -(HypixelConstants
    .BASE - 0.5 * HypixelConstants.GROWTH) / HypixelConstants.GROWTH;

HypixelConstants.REVERSE_CONST = HypixelConstants
    .REVERSE_PQ_PREFIX * HypixelConstants.REVERSE_PQ_PREFIX;

HypixelConstants.GROWTH_DIVIDES_2 = 2 / HypixelConstants.GROWTH;

class HypixelLeveling {
    /**
     * Get the exact level of a player
     * @param {Number} exp The EXP of the player.
     * @returns {Number} The exact level, which may be a decimal.
     */
    static getExactLevel(exp) {
        return this.getLevel(exp) + this.getPercentageToNextLevel(exp);
    }

    /**
     * Get the level of a player.
     * @param {Number} exp The EXP of the player.
     * @returns {Number} The level with no decimal points.
     */
    static getLevel(exp) {
        return exp === 0
            ? 1
            : Math.floor(1 + HypixelConstants.REVERSE_PQ_PREFIX + Math
                .sqrt(HypixelConstants.REVERSE_CONST + HypixelConstants.GROWTH_DIVIDES_2 * exp));
    }

    /**
     * Get the percent required to the next level.
     * @param {Number} exp The EXP of the player.
     * @returns {Number} The percentage.
     */
    static getPercentageToNextLevel(exp) {
        let lv = this.getLevel(exp);
        let x0 = this.getTotalExpToLevel(lv);

        return (exp - x0) / (this.getTotalExpToLevel(lv + 1) - x0);
    }

    /**
     * Get the exact amount of EXP required to reach the next level.
     * @param {Number} level The level.
     * @returns {Number} The EXP required.
     */
    static getTotalExpToLevel(level) {
        let lv = Math.floor(level);
        let x0 = this.getTotalExpToFullLevel(lv);

        if (level === lv) {
            return x0;
        }

        return (this.getTotalExpToFullLevel(lv + 1) - x0) * (level % 1) + x0;
    }

    /**
     * Get the total EXP to the player's full level.
     * @param {*} level The level.
     * @returns The total EXP to the player's full level.
     */
    static getTotalExpToFullLevel(level) {
        return (HypixelConstants.HALF_GROWTH * (level - 2) + HypixelConstants.BASE) * (level - 1);
    }

    /**
     * Get the EXP from one level to the next.
     * @param {Number} level The level.
     * @returns {Number} The EXP requirement.
     */
    static getExpFromLevelToNext(level) {
        return level < 1
            ? HypixelConstants.BASE
            : HypixelConstants.GROWTH * (level - 1) + HypixelConstants.BASE;
    }
}

module.exports = HypixelLeveling;