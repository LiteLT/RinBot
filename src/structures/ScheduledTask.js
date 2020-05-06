/**
 * Represents a scheduled task.
 * @property {Client} client The client instance.
 * @property {String} taskID The unique ID of the task.
 * @property {String} storeName The store the task belongs to (e.g. mod-unmute).
 * @property {Object} [data] Optional data to pass to the task once it's been called.
 * @property {Object} [options] Optional options.
 */
class ScheduledTask {
    constructor(client, taskID, storeName, data = null, options = null) {
        this.client = client;
        this.taskID = taskID;
        this.storeName = storeName;
        this.data = data;
        this.options = options;
    }
}