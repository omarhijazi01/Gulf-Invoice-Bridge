import { useState } from 'react';
import type { Invoice, InvoiceFields, Item } from '../types';
const documentFields = [
  'invoice_number',
  'invoice_date',
  'supplier_name',
  'supplier_tax_number',
  'customer_name',
  'customer_tax_number',
  'currency',
] as const;
const moneyFields = ['subtotal', 'tax_amount', 'total_amount'] as const;
const itemFields = ['description', 'quantity', 'unit_price', 'tax_rate', 'total'] as const;
export const fieldLabel = (key: string) =>
  key.replaceAll('_', ' ').replace(/^./, (s) => s.toUpperCase());
export function InvoiceForm({
  invoice,
  busy,
  onSave,
  onCancel,
}: {
  invoice: Invoice;
  busy: boolean;
  onSave: (data: InvoiceFields & { version: number }) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<InvoiceFields>(
    () =>
      ({
        ...Object.fromEntries([...documentFields, ...moneyFields].map((k) => [k, invoice[k]])),
        items: invoice.items.map(({ id: _, ...item }) => {
          void _;
          return item;
        }),
      }) as InvoiceFields,
  );
  function itemChange(index: number, key: keyof Item, value: string) {
    setValues({
      ...values,
      items: values.items.map((item, i) =>
        i === index ? { ...item, [key]: value || null } : item,
      ),
    });
  }
  return (
    <form
      className="panel"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ ...values, version: invoice.version });
      }}
    >
      <div className="panel-header">
        <div>
          <h2>Review & correct</h2>
          <p>Saving clears previous validation. Re-run the rules before approval.</p>
        </div>
      </div>
      <div className="form-grid">
        {[...documentFields, ...moneyFields].map((key) => (
          <label key={key}>
            {fieldLabel(key)}
            <input
              type={key === 'invoice_date' ? 'date' : 'text'}
              maxLength={300}
              inputMode={moneyFields.some((k) => k === key) ? 'decimal' : undefined}
              value={values[key] ?? ''}
              onChange={(e) => setValues({ ...values, [key]: e.target.value || null })}
            />
          </label>
        ))}
      </div>
      <div className="panel-padding">
        <h3>Line items</h3>
        <div className="table-wrap">
          <table className="editable-table">
            <thead>
              <tr>
                {itemFields.map((key) => (
                  <th key={key}>{fieldLabel(key)}</th>
                ))}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {values.items.map((item, index) => (
                <tr key={index}>
                  {itemFields.map((key) => (
                    <td key={key}>
                      <input
                        aria-label={`Line ${index + 1} ${fieldLabel(key)}`}
                        value={item[key] ?? ''}
                        onChange={(e) => itemChange(index, key, e.target.value)}
                        inputMode={key === 'description' ? 'text' : 'decimal'}
                      />
                    </td>
                  ))}
                  <td>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() =>
                        setValues({ ...values, items: values.items.filter((_, i) => i !== index) })
                      }
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          className="button secondary"
          onClick={() =>
            setValues({
              ...values,
              items: [
                ...values.items,
                { description: '', quantity: '1', unit_price: '', tax_rate: '', total: '' },
              ],
            })
          }
        >
          Add line item
        </button>
      </div>
      <div className="form-actions">
        <button type="button" className="button secondary" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
        <button className="button primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save corrections'}
        </button>
      </div>
    </form>
  );
}
