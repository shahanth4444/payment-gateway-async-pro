/**
 * Payment Gateway SDK
 * Embeddable widget for accepting payments
 */

class PaymentGateway {
    constructor(options) {
        // Validate required options
        if (!options || !options.key) {
            throw new Error('API key is required');
        }
        if (!options.orderId) {
            throw new Error('Order ID is required');
        }

        this.config = {
            key: options.key,
            orderId: options.orderId,
            onSuccess: options.onSuccess || function () { },
            onFailure: options.onFailure || function () { },
            onClose: options.onClose || function () { },
            checkoutUrl: options.checkoutUrl || 'http://localhost:3001',
        };

        this.modal = null;
        this.messageHandler = this.handleMessage.bind(this);
    }

    /**
     * Open the payment modal
     */
    open() {
        // Create modal overlay
        this.modal = document.createElement('div');
        this.modal.id = 'payment-gateway-modal';
        this.modal.setAttribute('data-test-id', 'payment-modal');

        // Create modal HTML
        this.modal.innerHTML = `
      <div class="modal-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
      ">
        <div class="modal-content" style="
          position: relative;
          width: 90%;
          max-width: 600px;
          height: 80vh;
          max-height: 700px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        ">
          <button 
            data-test-id="close-modal-button" 
            class="close-button"
            style="
              position: absolute;
              top: 15px;
              right: 15px;
              width: 32px;
              height: 32px;
              border: none;
              background: #f3f4f6;
              color: #374151;
              font-size: 24px;
              line-height: 1;
              border-radius: 50%;
              cursor: pointer;
              z-index: 10;
              transition: all 0.2s;
            "
            onmouseover="this.style.background='#e5e7eb'"
            onmouseout="this.style.background='#f3f4f6'"
          >
            ×
          </button>
          <iframe 
            data-test-id="payment-iframe"
            src="${this.config.checkoutUrl}/checkout?order_id=${this.config.orderId}&embedded=true"
            style="
              width: 100%;
              height: 100%;
              border: none;
            "
          ></iframe>
        </div>
      </div>
    `;

        // Append to body
        document.body.appendChild(this.modal);

        // Add event listeners
        const closeButton = this.modal.querySelector('[data-test-id="close-modal-button"]');
        closeButton.addEventListener('click', () => this.close());

        // Listen for postMessage from iframe
        window.addEventListener('message', this.messageHandler);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close the payment modal
     */
    close() {
        if (this.modal) {
            document.body.removeChild(this.modal);
            this.modal = null;
        }

        // Remove message listener
        window.removeEventListener('message', this.messageHandler);

        // Restore body scroll
        document.body.style.overflow = '';

        // Call onClose callback
        this.config.onClose();
    }

    /**
     * Handle messages from iframe
     */
    handleMessage(event) {
        // In production, validate event.origin
        // For this project, we accept all origins

        const { type, data } = event.data;

        if (type === 'payment_success') {
            this.config.onSuccess(data);
            this.close();
        } else if (type === 'payment_failed') {
            this.config.onFailure(data);
        } else if (type === 'close_modal') {
            this.close();
        }
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentGateway;
}

// Expose globally
if (typeof window !== 'undefined') {
    window.PaymentGateway = PaymentGateway;
}

export default PaymentGateway;
