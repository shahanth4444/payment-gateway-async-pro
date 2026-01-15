const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { webhookQueue } = require('../config/queue');

/**
 * GET /api/v1/webhooks
 * List webhook logs with pagination
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;

        // Get total count
        const countResult = await db.query(
            'SELECT COUNT(*) FROM webhook_logs WHERE merchant_id = $1',
            [req.merchant.id]
        );

        const total = parseInt(countResult.rows[0].count);

        // Get webhook logs
        const result = await db.query(
            `SELECT id, event, status, attempts, created_at, last_attempt_at, response_code
       FROM webhook_logs
       WHERE merchant_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
            [req.merchant.id, limit, offset]
        );

        res.json({
            data: result.rows.map(log => ({
                id: log.id,
                event: log.event,
                status: log.status,
                attempts: log.attempts,
                created_at: log.created_at,
                last_attempt_at: log.last_attempt_at,
                response_code: log.response_code,
            })),
            total,
            limit,
            offset,
        });
    } catch (error) {
        console.error('Error fetching webhook logs:', error);
        res.status(500).json({
            error: {
                code: 'SERVER_ERROR',
                description: 'Internal server error',
            },
        });
    }
});

/**
 * POST /api/v1/webhooks/:id/retry
 * Manually retry a webhook
 */
router.post('/:id/retry', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        // Get webhook log
        const result = await db.query(
            'SELECT * FROM webhook_logs WHERE id = $1 AND merchant_id = $2',
            [id, req.merchant.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: {
                    code: 'NOT_FOUND_ERROR',
                    description: 'Webhook log not found',
                },
            });
        }

        const log = result.rows[0];

        // Reset attempts and status
        await db.query(
            `UPDATE webhook_logs
       SET attempts = 0, status = 'pending', next_retry_at = NULL
       WHERE id = $1`,
            [id]
        );

        // Enqueue webhook delivery job
        await webhookQueue.add('deliver-webhook', {
            webhookLogId: log.id,
            merchantId: log.merchant_id,
            event: log.event,
            payload: log.payload,
        });

        console.log(`✅ Webhook retry scheduled: ${id}`);

        res.json({
            id: log.id,
            status: 'pending',
            message: 'Webhook retry scheduled',
        });
    } catch (error) {
        console.error('Error retrying webhook:', error);
        res.status(500).json({
            error: {
                code: 'SERVER_ERROR',
                description: 'Internal server error',
            },
        });
    }
});

module.exports = router;
