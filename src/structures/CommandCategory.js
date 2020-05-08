/**
 * Represents a basic class for a command's category.
 */
class CommandCategory {
    /**
     * @param {String} name The naem of the category.
     * @param {String} [description=""] The description of the category.
     */
    constructor(name, description = "") {
        if (!name) {
            throw new Error("The \"name\" parameter is required");
        }

        /**
         * The name of the category.
         * @type {String}
         */
        this.name = name;

        /**
         * The description of the category.
         * @type {String}
         */
        this.description = description;
    }
}

module.exports = CommandCategory;