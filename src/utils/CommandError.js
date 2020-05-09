"use strict";

/**
 * @typedef {import("eris").Message} Message
 */
/**
 * Represents a CommandError class, used for sending common command fail messages.
 */
class CommandError {
    /**
     * Sends a message saying something was not found.
     * @param {Message} message The message to reference.
     * @param {String} type The thing that was not found. 
     * @param {String} [search=""] The input.
     * @returns {Promise<Message>} The created message.
     */
    static ERR_NOT_FOUND(message, type, search = "") {
        if (type) {
            return message.channel.createMessage(`No ${type} named "${search}" found.`
                .substring(0, 2000));
        }

        return message.channel.createMessage("Unable to resolve the following " +
        `entity: \`${type}\`.`);
    }

    /**
     * Sends a message saying something was not its valid type.
     * @param {Message} message The message to reference.
     * @param {String} label The label/title of the type, not the exact name.
     * @param {String} [type="type"] The type.
     * @returns {Promise<Message>} The newly created message.
     */
    static ERR_INVALID_ARG_TYPE(message, label, type = "type") {
        return message.channel
            .createMessage(`Invalid Usage: \`${label}\` must be a valid ${type}.`);
    }

    /**
     * Sends a message saying something went wrong with an API request.
     * @param {Message} message The message to reference.
     * @param {String} [name="API"] The name of the API
     * @returns {Promise<Message>} The new message.
     */
    static ERR_API_ERROR(message, name = "API") {
        return message.channel.createMessage(`There seems to be an issue with the ${name}. ` +
        "Try again later...");
    }

    /**
     * Sends a message notifying the user that no items were found in a collection.
     * @param {Message} message The message to reference.
     * @param {String} item The item in the collection.
     * @param {String} collection The collection name itself.
     * @returns {Promise<Message>} The new message.
     */
    static ERR_COLLECTION_EMPTY(message, item, collection) {
        return message.channel.createMessage(`No ${item} in the ${collection} collection were found.`);
    }

    /**
     * Sends a message notifying the user that an input was not in range.
     * @param {Message} message The message to reference.
     * @param {String} label The name to call it by.
     * @param {String} type The type of the label.
     * @param {String|Number} start The starting range.
     * @param {String|Number} end The ending range.
     * @param {String} [suffix=""] Any suffixes to add to the end of the input.
     * @returns {Promise<Message>} The new message.
     */
    static ERR_INVALID_RANGE(message, label, type, start, end, suffix = "") {
        return message.channel.createMessage(`Invalid Usage: \`${label}\` must be a ${type} between ${start} - ` +
        `${end}${suffix ? ` ${suffix}` : ""}.`);
    }

    /**
     * Sends a message notifying the user that their input was too long/short.
     * @param {Message} message The message to reference.
     * @param {String} label The type of user-input.
     * @param {String} type What made the length bad. Usually long/short.
     * @param {Number} length The length of what the user entered.
     * @param {Number} required The minimum/maximum length.
     * @returns {Promise<Message>} The created message.
     */
    static ERR_BAD_LENGTH(message, label, type, length, required) {
        return message.channel.createMessage(`Invalid Usage: Your ${label} is too ${type}. [${length}/${required}]`);
    }
}

module.exports = CommandError;