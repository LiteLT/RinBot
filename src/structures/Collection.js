"use strict";

/**
 * Repreesnts a Collection.
 * @extends {Map}
 */
class Collection extends Map {
    /**
     * Run a filter over all items returning values passing the function.
     * @param {Function} fn The function to run over each item. The function receives the item, index, and its `this`
     * value.
     * @returns {Collection} The new collection with items passing the function.
     */
    filter(fn) {
        let list = new this.constructor();
      
        for (const [key, value] of this.entries()) {
            if (fn(value, key, this)) {
                list.set(key, value);
            }
        }
      
        return list;
    }
  
    /**
     * Returns an array of values returned from running a function over each item.
     * @param {Function} fn The function to run over each item. The function receives the item, index and its `this`
     * value.
     * @returns {Array<any>} An array of each item returned from the function.
     */
    map(fn) {
        let arr = [];
            
        for (const [key, value] of this.entries()) {
            arr.push(fn(value, key, this));
        }
            
        return arr;
    }
  
    /**
     * Find an item in the collection.
     * @param {Function} fn The function to try finding an item from. The function must return a truthly value to return
     * as the value from the method. The function receives the item, index and its `this` value.
     * @returns {any} The item receives from the function, or `undefined` if nothing was found.
     */
    find(fn) {
        for (const [key, value] of this.entries()) {
            if (fn(value, key, this)) {
                return value;
            }
        }
    }
  
    /**
     * Check if every item in the collection passes the function.
     * @param {Function} fn The function to run over each item.
     * The function receives the item, index and its `this` value.
     * @returns {Boolean} A boolean signaling if it was successful or not.
     */
    every(fn) {
        return !!this.find((item, key) => fn(item, key, this));
    }
  
    /**
     * Check if a single item from the collection passes the function.
     * @param {Function} fn The function to run over each item.
     * The function receives the item, index and its `this` value.
     * @returns {Boolean} A boolean signaling if it was successful or not.
     */
    some(fn) {
        for (const [key, value] of this.entries()) {
            if (fn(value, key, this)) {
                return true;
            }
        }
      
        return false;
    }
  
    /**
     * Get a random item from the collection.
     * @returns {any} An item from the collection.
     */
    random() {
        return [...this.values()][Math.floor(Math.random() * this.size)];
    }
}

module.exports = Collection;