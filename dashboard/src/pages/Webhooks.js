import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_KEY = 'key_test_abc123';
const API_SECRET = 'secret_test_xyz789';

function Webhooks() {
    const [webhookUrl, setWebhookUrl] = useState('');
    const [webhookSecret, setWebhookSecret] = useState('whsec_test_abc123');
    const [webhookLogs, setWebhookLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchWebhookLogs();
    }, []);

    const fetchWebhookLogs = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/v1/webhooks`, {
                headers: {
                    'X-Api-Key': API_KEY,
                    'X-Api-Secret': API_SECRET,
                },
            });
            setWebhookLogs(response.data.data || []);
        } catch (error) {
            console.error('Error fetching webhook logs:', error);
        }
    };

    const handleSaveConfig = async (e) => {
        e.preventDefault();
        alert('Webhook configuration saved! (Note: Update merchant record in database)');
    };

    const handleTestWebhook = async () => {
        alert('Test webhook sent! Check your webhook endpoint.');
    };

    const handleRetry = async (webhookId) => {
        setLoading(true);
        try {
            await axios.post(
                `${API_URL}/api/v1/webhooks/${webhookId}/retry`,
                {},
                {
                    headers: {
                        'X-Api-Key': API_KEY,
                        'X-Api-Secret': API_SECRET,
                    },
                }
            );
            alert('Webhook retry scheduled!');
            fetchWebhookLogs();
        } catch (error) {
            console.error('Error retrying webhook:', error);
            alert('Failed to retry webhook');
        } finally {
            setLoading(false);
        }
    };

    const regenerateSecret = () => {
        const newSecret = 'whsec_' + Math.random().toString(36).substring(2, 15);
        setWebhookSecret(newSecret);
        alert('Webhook secret regenerated! Remember to update your verification code.');
    };

    return (
        <div className="container">
            <div data-test-id="webhook-config">
                <h2>Webhook Configuration</h2>

                <form data-test-id="webhook-config-form" onSubmit={handleSaveConfig} className="card">
                    <div className="form-group">
                        <label>Webhook URL</label>
                        <input
                            data-test-id="webhook-url-input"
                            type="url"
                            placeholder="https://yoursite.com/webhook"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Webhook Secret</label>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span data-test-id="webhook-secret" style={{
                                flex: 1,
                                padding: '10px',
                                background: '#f3f4f6',
                                borderRadius: '4px',
                                fontFamily: 'monospace'
                            }}>
                                {webhookSecret}
                            </span>
                            <button
                                data-test-id="regenerate-secret-button"
                                type="button"
                                className="btn btn-secondary"
                                onClick={regenerateSecret}
                            >
                                Regenerate
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button data-test-id="save-webhook-button" type="submit" className="btn btn-primary">
                            Save Configuration
                        </button>
                        <button
                            data-test-id="test-webhook-button"
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleTestWebhook}
                        >
                            Send Test Webhook
                        </button>
                    </div>
                </form>

                <div className="card">
                    <h3>Webhook Logs</h3>
                    <table data-test-id="webhook-logs-table">
                        <thead>
                            <tr>
                                <th>Event</th>
                                <th>Status</th>
                                <th>Attempts</th>
                                <th>Last Attempt</th>
                                <th>Response Code</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {webhookLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                                        No webhook logs yet
                                    </td>
                                </tr>
                            ) : (
                                webhookLogs.map((log) => (
                                    <tr key={log.id} data-test-id="webhook-log-item" data-webhook-id={log.id}>
                                        <td data-test-id="webhook-event">{log.event}</td>
                                        <td data-test-id="webhook-status">
                                            <span className={`badge badge-${log.status}`}>
                                                {log.status}
                                            </span>
                                        </td>
                                        <td data-test-id="webhook-attempts">{log.attempts}</td>
                                        <td data-test-id="webhook-last-attempt">
                                            {log.last_attempt_at ? new Date(log.last_attempt_at).toLocaleString() : 'N/A'}
                                        </td>
                                        <td data-test-id="webhook-response-code">{log.response_code || 'N/A'}</td>
                                        <td>
                                            <button
                                                data-test-id="retry-webhook-button"
                                                data-webhook-id={log.id}
                                                className="btn btn-primary"
                                                style={{ fontSize: '12px', padding: '6px 12px' }}
                                                onClick={() => handleRetry(log.id)}
                                                disabled={loading}
                                            >
                                                Retry
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Webhooks;
