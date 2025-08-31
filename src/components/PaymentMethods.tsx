import React from 'react';
import { PaymentMethod } from '../types';

interface PaymentMethodsProps {
  methods: PaymentMethod[];
  selectedMethod: string | null;
  onMethodSelect: (methodId: string) => void;
}

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({
  methods,
  selectedMethod,
  onMethodSelect,
}) => {
  return (
    <div className="sp-payment-methods">
      <h3 className="sp-payment-methods-title">Choose Payment Method</h3>
      <div className="sp-payment-methods-grid">
        {methods.map((method) => (
          <button
            key={method.id}
            className={`sp-payment-method ${
              selectedMethod === method.id ? 'sp-payment-method-selected' : ''
            }`}
            onClick={() => onMethodSelect(method.id)}
          >
            <div className="sp-payment-method-icon">
              {method.icon}
            </div>
            <span className="sp-payment-method-name">{method.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};