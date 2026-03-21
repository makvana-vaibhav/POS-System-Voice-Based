import { useState } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';

function MenuItemCard({
  item,
  onEdit,
  onDelete,
  onAction,
  actionLabel = 'Action',
  cardClickable = false,
  hideActionButton = false,
  isEditing,
  onUpdateItem,
  onCancelEdit,
  formData,
  setFormData,
  categories,
}) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSaveEdit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        category_id: formData.category_id ? Number(formData.category_id) : null,
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        is_available: Boolean(formData.is_available),
      };
      await onUpdateItem?.(item.id, payload);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSubmitting(false);
    }
  }

  if (isEditing && onUpdateItem) {
    return (
      <article className="menu-item-card menu-item-card-editing">
        <form onSubmit={handleSaveEdit} className="menu-item-edit-form">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Item name"
            className="edit-input edit-input-name"
            autoFocus
            required
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
            placeholder="Price"
            className="edit-input edit-input-price"
            required
          />
          <select
            value={formData.category_id}
            onChange={(e) => setFormData((prev) => ({ ...prev, category_id: e.target.value }))}
            className="edit-input edit-select"
          >
            <option value="">No category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Description (optional)"
            className="edit-input edit-input-desc"
          />
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={Boolean(formData.is_available)}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, is_available: event.target.checked }))
              }
            />
            Available
          </label>
          <div className="edit-actions">
            <button type="submit" className="secondary-btn" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save'}
            </button>
            <button 
              type="button" 
              className="danger-btn" 
              onClick={() => onCancelEdit?.()}
            >
              Cancel
            </button>
          </div>
        </form>
      </article>
    );
  }

  const canClickWholeCard = cardClickable && Boolean(onAction) && !onEdit && !onDelete;

  return (
    <article
      className={`menu-item-card${canClickWholeCard ? ' menu-item-card-clickable' : ''}`}
      onClick={canClickWholeCard ? onAction : undefined}
      onKeyDown={
        canClickWholeCard
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onAction?.();
              }
            }
          : undefined
      }
      role={canClickWholeCard ? 'button' : undefined}
      tabIndex={canClickWholeCard ? 0 : undefined}
      aria-label={canClickWholeCard ? `Add ${item.name} to bill` : undefined}
    >
      <div className="menu-item-visual" aria-hidden="true">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} />
        ) : (
          <span>{(item.name || '?').slice(0, 1).toUpperCase()}</span>
        )}
      </div>

      <div className="menu-item-header">
        <h3>{item.name}</h3>
        <span className="menu-price">{formatCurrency(item.price)}</span>
      </div>

      <div className="menu-item-meta-row">
        <p className="menu-category">{item.category_name || 'Uncategorized'}</p>
        <span className={`status-badge ${item.is_available ? 'status-available' : 'status-cancelled'}`}>
          {item.is_available ? 'Available' : 'Out of Stock'}
        </span>
      </div>
      {item.description ? <p className="menu-description">{item.description}</p> : null}

      {onAction && !hideActionButton ? (
        <div className="menu-item-cta">
          <button
            className="primary-btn"
            onClick={(event) => {
              event.stopPropagation();
              onAction();
            }}
          >
            {actionLabel}
          </button>
        </div>
      ) : null}

      {onEdit || onDelete ? (
        <div className="menu-item-actions">
          <details className="inline-action-menu" onClick={(event) => event.stopPropagation()}>
            <summary>⋯</summary>
            <div className="inline-action-menu-items">
              {onEdit ? (
                <button className="secondary-btn" onClick={() => onEdit(item)}>
                  Edit
                </button>
              ) : null}
              {onDelete ? (
                <button className="danger-btn" onClick={() => onDelete(item.id)}>
                  Delete
                </button>
              ) : null}
            </div>
          </details>
        </div>
      ) : null}
    </article>
  );
}

export default MenuItemCard;
