/**
 * Webhook Logger
 * Manages webhook history display in table format and detail modal
 */

class WebhookLogger {
    constructor() {
        this.history = []; // Store last 50 webhook events
        this.maxHistory = 50;
        this.storageKey = 'kirimkan_webhook_history';
        this.tableBody = document.getElementById('webhookHistoryTable');

        // Load history from localStorage on init
        this.loadFromStorage();
    }

    /**
     * Load history from localStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.history = JSON.parse(stored);
                this.updateTable();
            }
        } catch (e) {
            console.error('Failed to load webhook history from storage:', e);
        }
    }

    /**
     * Save history to localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.history));
        } catch (e) {
            console.error('Failed to save webhook history to storage:', e);
        }
    }

    /**
     * Add new webhook log entry
     */
    addLog(data) {
        // Add timestamp if not present
        if (!data.timestamp) {
            data.timestamp = new Date().toISOString();
        }

        // Debug log to check data
        console.log('WebhookLogger.addLog received:', data);

        // Add to beginning of array
        this.history.unshift(data);

        // Keep only last 50 entries
        if (this.history.length > this.maxHistory) {
            this.history = this.history.slice(0, this.maxHistory);
        }

        // Save to localStorage
        this.saveToStorage();

        // Update table display
        this.updateTable();
    }

    /**
     * Clear all history
     */
    clearHistory() {
        this.history = [];
        localStorage.removeItem(this.storageKey);
        this.updateTable();
    }

    /**
     * Update the webhook history table
     */
    updateTable() {
        if (!this.tableBody) return;

        // Clear existing rows
        this.tableBody.innerHTML = '';

        if (this.history.length === 0) {
            // Show empty state
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                        <i class="fas fa-inbox"></i><br>
                        No webhook history yet. Webhooks will appear here in real-time.
                    </td>
                </tr>
            `;
            return;
        }

        // Populate with history
        this.history.forEach((item, index) => {
            const row = this.createTableRow(item, index);
            this.tableBody.appendChild(row);
        });
    }

    /**
     * Create table row for webhook entry
     */
    createTableRow(data, index) {
        const row = document.createElement('tr');

        // Session - check both root level and payload
        const sessionCell = document.createElement('td');
        const sessionId = data.sessionId || data.payload?.sessionId || '-';
        sessionCell.textContent = sessionId;
        sessionCell.style.fontWeight = '600';
        row.appendChild(sessionCell);

        // Event Type
        const eventCell = document.createElement('td');
        const eventBadge = document.createElement('span');
        eventBadge.className = 'event-type-badge';
        eventBadge.textContent = data.event || '-';
        eventCell.appendChild(eventBadge);
        row.appendChild(eventCell);

        // Target URL
        const urlCell = document.createElement('td');
        urlCell.textContent = data.url || '-';
        urlCell.style.maxWidth = '300px';
        urlCell.style.overflow = 'hidden';
        urlCell.style.textOverflow = 'ellipsis';
        urlCell.style.whiteSpace = 'nowrap';
        row.appendChild(urlCell);

        // Status (clickable)
        const statusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge ${data.success ? 'success' : 'error'}`;
        statusBadge.textContent = data.status ? `HTTP ${data.status}` : (data.success ? 'Success' : 'Failed');
        statusBadge.style.cursor = 'pointer';
        statusBadge.title = 'Click to view details';

        // Add click handler
        statusBadge.addEventListener('click', () => {
            this.showDetailModal(data);
        });

        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);

        // Time
        const timeCell = document.createElement('td');
        const timestamp = new Date(data.timestamp || Date.now());
        const timeStr = timestamp.toLocaleTimeString('en-US', { hour12: false });
        timeCell.innerHTML = timeStr;
        row.appendChild(timeCell);

        return row;
    }

    /**
     * Show webhook detail modal
     */
    showDetailModal(data) {
        const modal = document.getElementById('webhookDetailModal');
        if (!modal) return;

        // Populate modal fields - check both root and payload for sessionId
        const sessionId = data.sessionId || data.payload?.sessionId || '-';
        document.getElementById('webhookDetailSession').textContent = sessionId;
        document.getElementById('webhookDetailEvent').textContent = data.event || '-';

        const statusEl = document.getElementById('webhookDetailStatus');
        statusEl.textContent = data.status ? `HTTP ${data.status}` : (data.success ? 'Success' : 'Failed');
        statusEl.style.color = data.success ? '#10b981' : '#ef4444';

        const timestamp = new Date(data.timestamp || Date.now());
        document.getElementById('webhookDetailTime').textContent = timestamp.toLocaleString();

        document.getElementById('webhookDetailUrl').textContent = data.url || '-';

        // Format JSON payload
        const payload = data.payload || {};
        document.getElementById('webhookDetailPayload').textContent = JSON.stringify(payload, null, 2);

        // Format response - improved handling for various types
        let responseText = '-';
        if (data.error) {
            responseText = `Error: ${data.error}`;
        } else if (data.response !== undefined && data.response !== null) {
            try {
                // Handle different response types
                if (typeof data.response === 'object') {
                    // Already an object or array, stringify it
                    responseText = JSON.stringify(data.response, null, 2);
                } else if (typeof data.response === 'string') {
                    // Try to parse if it's JSON string
                    try {
                        const parsed = JSON.parse(data.response);
                        responseText = JSON.stringify(parsed, null, 2);
                    } catch (e) {
                        // Not JSON, display as is
                        responseText = data.response;
                    }
                } else {
                    // Number, boolean, etc
                    responseText = String(data.response);
                }
            } catch (e) {
                console.error('Error formatting response:', e);
                responseText = String(data.response);
            }
        }
        document.getElementById('webhookDetailResponse').textContent = responseText;

        // Show modal
        modal.classList.add('visible');
    }
}

// Initialize webhook logger when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.webhookLogger = new WebhookLogger();
    });
} else {
    window.webhookLogger = new WebhookLogger();
}
