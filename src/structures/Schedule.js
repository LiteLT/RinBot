/**
 * @typedef {import("../Client.js")} Client
 */
/**
 * Represents a schedule for all tasks.
 * @property {Client} client The Discord client instance.
 * @property {Object} options A list of options/settings for the schedule.
 * @property {Array<>}
 */
class Schedule {
    constructor(client, options) {
        this.client = client;
        this.options = options;
        this.tasks = [];
    }
}

module.exports = Schedule;

// class Schedule {
//     constructor(client, options) {
//         this.client = client;
//         this.tasks = client.tasks;
//         this.options = options;
//         this._interval = null;

//         if (!Array.isArray(this.tasks)) {
//             return;
//         }

//         for (const task of this.tasks) {
//             try {
//                 await this._add(task.name);
//             }
//         }
//     }

//     /**
//      * Runs all tasks.
//      */
//     async execute() {
//         if (!this.client.ready) {
//             return;
//         }

//         if (this.tasks.length) {
//             let now = Date.now();
//             let toExecute = [];

//             for (const task of this.tasks) {
//                 if (task.time.getTime() > now) {
//                     break;
//                 }

//                 toExecute.push(task.run());
//             }

//             if (!toExecute.length) {
//                 return;
//             }

//             await Promise.all(toExecute);
//         }

//         return this._checkInterval();
//     }

//     /**
//      * Clears the current interval.
//      */
//     _clearInterval() {
//         clearInterval(this._interval);
//         this._interval = null;
//     }

//     _checkInterval() {
//         if (!this.tasks.length) {
//             return this._clearInterval();
//         } else if (!this._interval) {
//             this._interval = setInterval(() => this.execute(), this.options.schedule.interval);
//         }
//     }
// }