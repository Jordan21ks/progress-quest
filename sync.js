/**
 * Synchronization module for handling offline-to-online data transfer
 * Ensures data is never lost when working offline
 */

import * as Storage from './storage.js';
import { getToken, getUsername, getAuthTokens, storeAuthTokens } from './data.js';

// Track sync state
let syncing = false;
let pendingSync = false;
let lastSyncAttempt = 0;
const SYNC_COOLDOWN = 10000; // 10 seconds minimum between sync attempts to avoid overloading the server

/**
 * Attempt to synchronize local data with the server
 * This performs a two-way sync - getting server data and sending local changes
 * @param {boolean} force Force a sync even if one was recently attempted
 * @returns {Promise<object>} Sync result with success status and statistics
 */
export async function synchronizeData(force = false) {
    const now = Date.now();
    
    // Prevent multiple syncs running at once or too frequent syncs
    if (syncing) {
        pendingSync = true;
        console.log('Sync already in progress, queuing another sync');
        return { queued: true };
    }
    
    if (!force && now - lastSyncAttempt < SYNC_COOLDOWN) {
        console.log('Sync attempted too recently, skipping');
        return { throttled: true, lastSyncTime: new Date(lastSyncAttempt).toISOString() };
    }
    
    syncing = true;
    lastSyncAttempt = now;
    
    try {
        // Check if we're online
        if (!navigator.onLine) {
            console.log('Device is offline, skipping sync');
            return { offline: true };
        }
        
        // Get the token and validate current auth
        const token = await getToken();
        if (!token) {
            console.log('No authentication token, cannot sync');
            return { unauthenticated: true };
        }
        
        // Get the username
        const username = getUsername();
        if (!username) {
            console.log('No username available, cannot sync');
            return { noUsername: true };
        }
        
        // Get last sync timestamp for this user
        const lastSync = await Storage.getLastSyncTime(username);
        
        // Get local data
        const { skills, financial } = await Storage.getGoals(username);
        
        console.log(`Starting sync for ${username} with ${skills.length} skills and ${financial.length} financial goals`);
        
        // Call the sync API endpoint
        const response = await fetch('/api/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                skills,
                financial,
                last_sync: lastSync
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            
            // Special handling for expired tokens - attempt refresh
            if (response.status === 401 && errorData.code === 'token_expired') {
                // Try to refresh the token and retry
                const refreshed = await refreshTokenAndRetry();
                if (refreshed) {
                    // Recursively call sync again with the new token
                    return synchronizeData(true);
                }
            }
            
            throw new Error(errorData.error || 'Sync failed');
        }
        
        // Process the response
        const serverData = await response.json();
        
        // Store the updated data in IndexedDB
        await Storage.saveGoals(
            serverData.skills || [],
            serverData.financial || [],
            username
        );
        
        // Return sync statistics
        return {
            success: true,
            syncTime: serverData.sync_time,
            created: serverData.created,
            updated: serverData.updated,
            skills: serverData.skills?.length,
            financial: serverData.financial?.length
        };
    } catch (error) {
        console.error('Sync error:', error);
        return {
            success: false,
            error: error.message
        };
    } finally {
        syncing = false;
        
        // If another sync was requested while this one was running, start it
        // But add a small delay to prevent immediate retries
        if (pendingSync) {
            pendingSync = false;
            setTimeout(() => synchronizeData(), 1000);
        }
    }
}

/**
 * Attempt to refresh the access token when it expires
 * @returns {Promise<boolean>} True if token was successfully refreshed
 */
async function refreshTokenAndRetry() {
    try {
        const tokens = getAuthTokens();
        const refreshToken = tokens?.refreshToken;
        
        if (!refreshToken) {
            console.log('No refresh token available');
            return false;
        }
        
        const response = await fetch('/api/token/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                refresh_token: refreshToken
            })
        });
        
        if (!response.ok) {
            console.error('Token refresh failed');
            return false;
        }
        
        const data = await response.json();
        
        // Store the new tokens
        storeAuthTokens(
            data.access_token,
            data.refresh_token, // May be undefined if not rotating
            data.expires_in
        );
        
        console.log('Successfully refreshed authentication token');
        return true;
    } catch (error) {
        console.error('Error refreshing token:', error);
        return false;
    }
}

/**
 * Set up automatic synchronization
 * This sets event listeners to trigger sync when appropriate
 */
export function setupAutoSync() {
    // Sync when coming back online
    window.addEventListener('online', () => {
        console.log('Device came online, triggering sync');
        synchronizeData();
    });
    
    // Sync when the page becomes visible again (user returns to the tab)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            console.log('Page became visible, checking for sync');
            synchronizeData();
        }
    });
    
    // Set up periodic sync every 5 minutes when the page is open
    // This ensures we don't miss updates from other devices
    let syncInterval;
    
    function startPeriodicSync() {
        // Clear any existing intervals
        if (syncInterval) {
            clearInterval(syncInterval);
        }
        
        // Only set up if we're online
        if (navigator.onLine) {
            syncInterval = setInterval(() => {
                synchronizeData();
            }, 5 * 60 * 1000); // 5 minutes
        }
    }
    
    // Start periodic sync and restart when online status changes
    startPeriodicSync();
    window.addEventListener('online', startPeriodicSync);
    window.addEventListener('offline', () => {
        if (syncInterval) {
            clearInterval(syncInterval);
            syncInterval = null;
        }
    });
    
    // Initial sync on page load
    setTimeout(() => {
        synchronizeData();
    }, 1000);
}

/**
 * Force an immediate synchronization
 * Use this when you need to ensure the latest data is synced
 * @returns {Promise<object>} Sync result
 */
export async function forceSynchronization() {
    return synchronizeData(true);
}

/**
 * Save item locally and queue for sync
 * Use this when updating items while potentially offline
 * @param {Object} item The goal/skill item to save
 * @param {string} type Either 'skill' or 'financial'
 * @returns {Promise<boolean>} Success status
 */
export async function saveItemLocally(item, type) {
    try {
        if (!item) return false;
        
        const username = getUsername();
        if (!username) return false;
        
        // Get current goals
        const { skills, financial } = await Storage.getGoals(username);
        
        if (type === 'skill') {
            // Find if it exists
            const index = skills.findIndex(s => 
                (item.id && s.id === item.id) || 
                (!item.id && s.name === item.name)
            );
            
            if (index >= 0) {
                // Update existing
                skills[index] = { ...skills[index], ...item };
            } else {
                // Add new
                skills.push(item);
            }
        } else {
            // Financial goal
            const index = financial.findIndex(f => 
                (item.id && f.id === item.id) || 
                (!item.id && f.name === item.name)
            );
            
            if (index >= 0) {
                // Update existing
                financial[index] = { ...financial[index], ...item };
            } else {
                // Add new
                financial.push(item);
            }
        }
        
        // Save to storage
        await Storage.saveGoals(skills, financial, username);
        
        // Try to sync if we're online, but don't start immediately
        // Use requestIdleCallback if available for better performance
        if (navigator.onLine) {
            if (window.requestIdleCallback) {
                window.requestIdleCallback(() => synchronizeData());
            } else {
                setTimeout(() => synchronizeData(), 1500);
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error saving item locally:', error);
        return false;
    }
}

/**
 * Delete item locally and queue for sync
 * @param {string|number} itemId The ID of the item to delete
 * @param {string} type Either 'skill' or 'financial'
 * @returns {Promise<boolean>} Success status
 */
export async function deleteItemLocally(itemId, type) {
    try {
        const username = getUsername();
        if (!username) return false;
        
        // Get current goals
        const { skills, financial } = await Storage.getGoals(username);
        
        if (type === 'skill') {
            const index = skills.findIndex(s => s.id === itemId);
            if (index >= 0) {
                skills.splice(index, 1);
            }
        } else {
            const index = financial.findIndex(f => f.id === itemId);
            if (index >= 0) {
                financial.splice(index, 1);
            }
        }
        
        // Save to storage
        await Storage.saveGoals(skills, financial, username);
        
        // Try to sync if we're online, but don't start immediately
        // Use requestIdleCallback if available for better performance
        if (navigator.onLine) {
            if (window.requestIdleCallback) {
                window.requestIdleCallback(() => synchronizeData());
            } else {
                setTimeout(() => synchronizeData(), 1500);
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error deleting item locally:', error);
        return false;
    }
}

/**
 * Get all local data
 * @returns {Promise<Object>} The skills and financial goals
 */
export async function getLocalData() {
    try {
        const username = getUsername();
        if (!username) return { skills: [], financial: [] };
        
        return await Storage.getGoals(username);
    } catch (error) {
        console.error('Error getting local data:', error);
        return { skills: [], financial: [] };
    }
}
