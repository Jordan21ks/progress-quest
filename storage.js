/**
 * Enhanced storage service using IndexedDB with localStorage fallback
 * This provides a robust storage solution for offline capability
 */

const DB_NAME = 'progress_quest_db';
const DB_VERSION = 1;
const STORES = {
    GOALS: 'goals',
    USER_DATA: 'user_data',
    SYNC: 'sync_info'
};

// Initialize the database
let dbPromise;
let dbInitFailed = false;

function initDB() {
    // If we already know IndexedDB failed, don't try again
    if (dbInitFailed) {
        return Promise.resolve(null);
    }
    
    // Return the existing promise if we have one
    if (dbPromise) return dbPromise;
    
    dbPromise = new Promise((resolve, reject) => {
        // Check if IndexedDB is available
        if (!window.indexedDB) {
            console.warn('IndexedDB not supported, falling back to localStorage');
            dbInitFailed = true;
            resolve(null);
            return;
        }
        
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
            reject(event.target.error);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create object stores if they don't exist
            if (!db.objectStoreNames.contains(STORES.GOALS)) {
                const goalsStore = db.createObjectStore(STORES.GOALS, { keyPath: 'id', autoIncrement: true });
                goalsStore.createIndex('type', 'type', { unique: false });
                goalsStore.createIndex('userId', 'userId', { unique: false });
            }
            
            if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
                db.createObjectStore(STORES.USER_DATA, { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains(STORES.SYNC)) {
                db.createObjectStore(STORES.SYNC, { keyPath: 'id' });
            }
        };
        
        request.onsuccess = (event) => {
            resolve(event.target.result);
        };
    });
    
    return dbPromise;
}

/**
 * Store data in IndexedDB with localStorage fallback
 */
export async function storeData(storeName, id, data) {
    try {
        const db = await initDB();
        
        if (!db) {
            // Fall back to localStorage
            localStorage.setItem(`${storeName}_${id}`, JSON.stringify(data));
            return;
        }
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // If data has no id but id parameter is provided, use that
            if (typeof data === 'object' && !data.id && id) {
                data.id = id;
            }
            
            const request = id ? store.put(data) : store.add(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            transaction.oncomplete = () => console.log(`Data stored in ${storeName}`);
        });
    } catch (error) {
        console.error('Error storing data:', error);
        // Fall back to localStorage in case of error
        if (id) {
            localStorage.setItem(`${storeName}_${id}`, JSON.stringify(data));
        }
        throw error;
    }
}

/**
 * Retrieve data from IndexedDB with localStorage fallback
 */
export async function getData(storeName, id) {
    try {
        const db = await initDB();
        
        if (!db) {
            // Fall back to localStorage
            const data = localStorage.getItem(`${storeName}_${id}`);
            return data ? JSON.parse(data) : null;
        }
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error retrieving data:', error);
        // Try localStorage as fallback
        try {
            const data = localStorage.getItem(`${storeName}_${id}`);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }
}

/**
 * Delete data from IndexedDB with localStorage fallback
 */
export async function deleteData(storeName, id) {
    try {
        const db = await initDB();
        
        if (!db) {
            // Fall back to localStorage
            localStorage.removeItem(`${storeName}_${id}`);
            return;
        }
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error deleting data:', error);
        // Try localStorage as fallback
        localStorage.removeItem(`${storeName}_${id}`);
    }
}

/**
 * Get all data from a store with filtering
 */
export async function getAllData(storeName, filterFn = null) {
    try {
        const db = await initDB();
        
        if (!db) {
            // Fall back to localStorage, this is less efficient
            const results = [];
            const prefix = `${storeName}_`;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(prefix)) {
                    try {
                        const item = JSON.parse(localStorage.getItem(key));
                        if (!filterFn || filterFn(item)) {
                            results.push(item);
                        }
                    } catch (e) {
                        console.warn(`Error parsing localStorage item: ${key}`, e);
                    }
                }
            }
            
            return results;
        }
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                if (filterFn) {
                    resolve(request.result.filter(filterFn));
                } else {
                    resolve(request.result);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error getting all data:', error);
        return [];
    }
}

/**
 * Clear all data for a given store
 */
export async function clearStore(storeName) {
    try {
        const db = await initDB();
        
        if (!db) {
            // Fall back to localStorage
            const keysToRemove = [];
            const prefix = `${storeName}_`;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(prefix)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            return;
        }
        
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Error clearing store:', error);
    }
}

/**
 * Save goals (skills and financial) to IndexedDB using batched operations
 * @param {Array} skills Array of skill objects
 * @param {Array} financial Array of financial goal objects
 * @param {string} userId User ID to associate with these goals
 * @returns {Promise<Object>} Stats about the saved goals
 */
export async function saveGoals(skills = [], financial = [], userId = 'default') {
    try {
        // First clear existing goals for this user
        await clearUserGoals(userId);
        
        // If no IndexedDB, fall back to localStorage
        const db = await initDB();
        if (!db) {
            // For localStorage, we still need to use sequential operations
            console.log('Using localStorage fallback for saveGoals');
            
            // Save skills
            for (const skill of skills) {
                await storeData(STORES.GOALS, null, {
                    ...skill,
                    type: 'skill',
                    userId
                });
            }
            
            // Save financial goals
            for (const goal of financial) {
                await storeData(STORES.GOALS, null, {
                    ...goal,
                    type: 'financial',
                    userId
                });
            }
            
            // Store sync timestamp
            await storeData(STORES.SYNC, 'lastSync', {
                id: 'lastSync',
                timestamp: new Date().toISOString(),
                userId
            });
            
            return {
                skills: skills.length,
                financial: financial.length
            };
        }
        
        // Use a single transaction for all operations when using IndexedDB
        // This ensures atomicity and better performance
        return new Promise((resolve, reject) => {
            try {
                // Open a single transaction for both stores
                const transaction = db.transaction([STORES.GOALS, STORES.SYNC], 'readwrite');
                const goalsStore = transaction.objectStore(STORES.GOALS);
                const syncStore = transaction.objectStore(STORES.SYNC);
                
                // Set up transaction event handlers
                transaction.onerror = (event) => {
                    console.error('Transaction error:', event.target.error);
                    reject(event.target.error);
                };
                
                transaction.oncomplete = () => {
                    console.log(`Successfully saved ${skills.length} skills and ${financial.length} financial goals`);
                    resolve({
                        skills: skills.length,
                        financial: financial.length
                    });
                };
                
                // Add all skills in batch (no await needed within a transaction)
                for (const skill of skills) {
                    goalsStore.add({
                        ...skill,
                        type: 'skill',
                        userId
                    });
                }
                
                // Add all financial goals
                for (const goal of financial) {
                    goalsStore.add({
                        ...goal,
                        type: 'financial',
                        userId
                    });
                }
                
                // Store sync timestamp
                syncStore.put({
                    id: 'lastSync',
                    timestamp: new Date().toISOString(),
                    userId
                });
                
                // Transaction will auto-commit when all operations complete
            } catch (error) {
                console.error('Error in saveGoals transaction:', error);
                reject(error);
            }
        });
    } catch (error) {
        console.error('saveGoals operation failed:', error);
        throw error;
    }
}

/**
 * Clear all goals for a specific user using a single transaction
 * @param {string} userId User ID to clear goals for
 * @returns {Promise<void>}
 */
export async function clearUserGoals(userId = 'default') {
    try {
        const db = await initDB();
        
        if (!db) {
            // This is inefficient for localStorage, but we do our best
            await clearStore(STORES.GOALS);
            return;
        }
        
        // First get the IDs of all goals for this user
        const goals = await getAllData(STORES.GOALS, item => item.userId === userId);
        
        if (goals.length === 0) {
            // No goals to delete
            return;
        }
        
        // Use a single transaction for all deletes
        return new Promise((resolve, reject) => {
            try {
                const transaction = db.transaction(STORES.GOALS, 'readwrite');
                const store = transaction.objectStore(STORES.GOALS);
                
                transaction.onerror = (event) => {
                    console.error('Transaction error in clearUserGoals:', event.target.error);
                    reject(event.target.error);
                };
                
                transaction.oncomplete = () => {
                    console.log(`Successfully cleared ${goals.length} goals for user ${userId}`);
                    resolve();
                };
                
                // Delete all goals in one transaction
                for (const goal of goals) {
                    store.delete(goal.id);
                }
                
                // Transaction auto-commits when all operations are done
            } catch (error) {
                console.error('Error in clearUserGoals transaction:', error);
                reject(error);
            }
        });
    } catch (error) {
        console.error('Error clearing user goals:', error);
    }
}

/**
 * Retrieve goals for a user
 */
export async function getGoals(userId = 'default') {
    try {
        const allGoals = await getAllData(STORES.GOALS, item => item.userId === userId);
        
        return {
            skills: allGoals.filter(goal => goal.type === 'skill'),
            financial: allGoals.filter(goal => goal.type === 'financial')
        };
    } catch (error) {
        console.error('Error getting goals:', error);
        return { skills: [], financial: [] };
    }
}

/**
 * Get last sync timestamp
 */
export async function getLastSyncTime(userId = 'default') {
    try {
        const syncInfo = await getData(STORES.SYNC, 'lastSync');
        
        if (syncInfo && syncInfo.userId === userId) {
            return syncInfo.timestamp;
        }
        
        return null;
    } catch (error) {
        console.error('Error getting last sync time:', error);
        return null;
    }
}

/**
 * Store user profile data
 */
export async function saveUserProfile(userData) {
    if (!userData || !userData.username) return false;
    
    try {
        await storeData(STORES.USER_DATA, 'profile', {
            id: 'profile',
            ...userData,
            updatedAt: new Date().toISOString()
        });
        
        return true;
    } catch (error) {
        console.error('Error saving user profile:', error);
        return false;
    }
}

/**
 * Get user profile data
 */
export async function getUserProfile() {
    try {
        return await getData(STORES.USER_DATA, 'profile');
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
}
