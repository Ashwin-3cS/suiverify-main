import { SuiClient } from '@mysten/sui/client';
import type { EventId, SuiEvent, SuiEventFilter } from '@mysten/sui/client';
import { getCurrentPackageId, getCurrentRpcEndpoint } from '@/config/contracts';
import { logger } from '@/lib/logger';

// Sui Configuration - Using centralized contract config
const fullnode = getCurrentRpcEndpoint();
const client = new SuiClient({ url: fullnode });

// Package ID from centralized config
const packageId = getCurrentPackageId();

// Configuration
const POLLING_INTERVAL_MS = 2000; // 2 seconds

type SuiEventsCursor = EventId | null | undefined;

type EventExecutionResult = {
    cursor: SuiEventsCursor;
    hasNextPage: boolean;
};

type EventTracker = {
    type: string;
    filter: SuiEventFilter;
    callback: (events: SuiEvent[], type: string) => Promise<void>;
};

// In-memory cursor storage
const cursors: Map<string, EventId> = new Map();

// Enhanced event data interface for VerificationCompleted events
export interface VerificationCompletedEventData {
    user_address: string;
    status: number;
    user_did_id: string;
    did_type: number;
    registry_id: string;
    nautilus_signature: number[];
    signature_timestamp_ms: string;  // Will be converted from number to string
    evidence_hash: number[];         // Byte array from contract
    nft_id?: string;                 // Optional NFT ID for DIDClaimed events
}

// Callback function to notify the UI about verification completion
let verificationCallback: ((eventData: VerificationCompletedEventData) => void) | null = null;

// Set the callback function from the UI
export const setVerificationCallback = (callback: (eventData: VerificationCompletedEventData) => void) => {
    verificationCallback = callback;
};

// Event handlers for DID Registry events
const handleDIDRegistryEvents = async (events: SuiEvent[], type: string): Promise<void> => {
    logger.log(` Processing ${events.length} DID Registry events from ${type}`);
    
    for (const event of events) {
        logger.log(` DID Registry Event Detected:`);
        logger.log(`   - Event Type: ${event.type}`);
        logger.log(`   - Transaction Digest: ${event.id.txDigest}`);
        logger.log(`   - Sender: ${event.sender}`);
        logger.log(`   - Timestamp: ${event.timestampMs ? new Date(parseInt(event.timestampMs)) : 'N/A'}`);
        
        if (event.parsedJson) {
            logger.log(`   - Event Data:`, JSON.stringify(event.parsedJson, null, 2));
        }
        
        // Process the DID event
        await processDIDEvent(event);
    }
};

// Custom DID event processing logic
const processDIDEvent = async (event: SuiEvent): Promise<void> => {
    try {
        const eventType = event.type;
        const eventData = event.parsedJson as VerificationCompletedEventData;
        
        // Handle VerificationCompleted events
        if (eventType.includes('::VerificationCompleted')) {
            logger.log(` VERIFICATION COMPLETED EVENT!`);
            logger.log(` User Address: ${eventData.user_address}`);
            logger.log(`🆔 DID Type: ${eventData.did_type} (${getDIDTypeName(eventData.did_type)})`);
            logger.log(` Status: ${eventData.status} (${getStatusName(eventData.status)})`);
            logger.log(` Nautilus Signature: ${eventData.nautilus_signature ? 'Present' : 'Missing'}`);
            logger.log(` User DID ID: ${eventData.user_did_id}`);
            logger.log(` Signature Timestamp: ${eventData.signature_timestamp_ms || 'N/A'}`);
            logger.log(` Evidence Hash: ${eventData.evidence_hash ? 'Present' : 'Missing'}`);
            
            // Create enhanced event data object
            const enhancedEventData: VerificationCompletedEventData = {
                user_address: eventData.user_address,
                status: eventData.status,
                user_did_id: eventData.user_did_id,
                did_type: eventData.did_type,
                registry_id: eventData.registry_id,
                nautilus_signature: eventData.nautilus_signature || [],
                signature_timestamp_ms: eventData.signature_timestamp_ms?.toString() || '0',
                evidence_hash: eventData.evidence_hash || []
            };
            
            // Notify the UI about verification completion with enhanced data
            if (verificationCallback) {
                verificationCallback(enhancedEventData);
            }
            
            // Handle verification completion
            await handleVerificationCompleted(eventData);
            
        } else if (eventType.includes('::VerificationStarted')) {
            logger.log(` VERIFICATION STARTED EVENT!`);
            logger.log(` User Address: ${eventData.user_address}`);
            logger.log(`🆔 DID Type: ${eventData.did_type} (${getDIDTypeName(eventData.did_type)})`);
            logger.log(` User DID ID: ${eventData.user_did_id}`);
            
        } else if (eventType.includes('::DIDClaimed')) {
            logger.log(` DID NFT CLAIMED EVENT!`);
            logger.log(` User Address: ${eventData.user_address}`);
            logger.log(` NFT ID: ${eventData.nft_id}`);
        }
        
    } catch (error) {
        console.error(` Error processing DID event ${event.id.txDigest}:`, error);
    }
};

// Helper functions for DID types and statuses
const getDIDTypeName = (didType: number): string => {
    switch (didType) {
        case 1: return 'Age Verification';
        case 2: return 'Citizenship Verification';
        default: return 'Unknown';
    }
};

const getStatusName = (status: number): string => {
    switch (status) {
        case 0: return 'Pending';
        case 1: return 'Verified';
        case 2: return 'Rejected';
        default: return 'Unknown';
    }
};

// Custom handler for verification completed events
const handleVerificationCompleted = async (eventData: VerificationCompletedEventData): Promise<void> => {
    try {
        logger.log(` Processing verification completion for user ${eventData.user_address}`);
        
        if (eventData.status === 1) { // STATUS_VERIFIED
            logger.log(` User ${eventData.user_address} successfully verified!`);
        } else if (eventData.status === 2) { // STATUS_REJECTED
            logger.log(` User ${eventData.user_address} verification rejected`);
        }
        
    } catch (error) {
        console.error(` Error handling verification completion:`, error);
    }
};

// Events to track - DID Registry events
const EVENTS_TO_TRACK: EventTracker[] = [
    {
        type: `${packageId}::did_registry`,
        filter: {
            MoveEventModule: {
                module: 'did_registry',
                package: packageId,
            },
        },
        callback: handleDIDRegistryEvents,
    },
];

const executeEventJob = async (
    client: SuiClient,
    tracker: EventTracker,
    cursor: SuiEventsCursor,
): Promise<EventExecutionResult> => {
    try {
        // Get the events from the chain
        const { data, hasNextPage, nextCursor } = await client.queryEvents({
            query: tracker.filter,
            cursor,
            order: 'ascending',
        });
        
        if (data.length > 0) {
            logger.log(` Found ${data.length} new events for ${tracker.type}`);
            
            // Handle the events
            await tracker.callback(data, tracker.type);
            
            // Update the cursor if we fetched new data
            if (nextCursor) {
                await saveLatestCursor(tracker, nextCursor);
                return {
                    cursor: nextCursor,
                    hasNextPage,
                };
            }
        }
        
    } catch (error) {
        console.error(` Error in executeEventJob for ${tracker.type}:`, error);
    }
    
    return {
        cursor,
        hasNextPage: false,
    };
};

const runEventJob = async (client: SuiClient, tracker: EventTracker, cursor: SuiEventsCursor) => {
    const result = await executeEventJob(client, tracker, cursor);
    
    // Continue polling
    setTimeout(
        () => {
            runEventJob(client, tracker, result.cursor);
        },
        result.hasNextPage ? 0 : POLLING_INTERVAL_MS,
    );
};

// Get the latest cursor for an event tracker
const getLatestCursor = async (tracker: EventTracker): Promise<SuiEventsCursor> => {
    return cursors.get(tracker.type) || undefined;
};

// Save the latest cursor for an event tracker
const saveLatestCursor = async (tracker: EventTracker, cursor: EventId): Promise<void> => {
    cursors.set(tracker.type, cursor);
    logger.log(` Saved cursor for ${tracker.type}: ${cursor.eventSeq}`);
};

// Start the event listener
export const startEventListener = async (): Promise<void> => {
    logger.log(' Starting Sui Event Listener for user verification...');
    
    try {
        // Test connection
        const latestCheckpoint = await client.getLatestCheckpointSequenceNumber();
        logger.log(` Connected to Sui network. Latest checkpoint: ${latestCheckpoint}`);
        
        logger.log(' Configuration:');
        logger.log(`   - Package ID: ${packageId}`);
        logger.log(`   - Polling Interval: ${POLLING_INTERVAL_MS}ms`);
        
        // Start listening for events
        for (const event of EVENTS_TO_TRACK) {
            logger.log(` Starting listener for: ${event.type}`);
            const cursor = await getLatestCursor(event);
            runEventJob(client, event, cursor);
        }
        
        logger.log(' Event listener is now running');
        
    } catch (error) {
        console.error(' Failed to start event listener:', error);
        throw error;
    }
};

// Stop the event listener
export const stopEventListener = () => {
    logger.log(' Stopping Sui Event Listener...');
    // Clear all cursors
    cursors.clear();
    verificationCallback = null;
};
