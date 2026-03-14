import { formatCurrency } from '../../utils/formatCurrency';

function MenuItemCard({ item, onEdit, onDelete, onAction, actionLabel = 'Action' }) {
  return (
    <article className="menu-item-card">
      <div className="menu-item-header">
        <h3>{item.name}</h3>
        <span className="menu-price">{formatCurrency(item.price)}</span>
      </div>

      <p className="menu-category">{item.category_name || 'Uncategorized'}</p>
      {item.description ? <p className="menu-description">{item.description}</p> : null}

      {onAction ? (
        <div className="menu-item-cta">
          <button className="primary-btn" onClick={onAction}>
            {actionLabel}
          </button>
        </div>
      ) : null}

      {onEdit || onDelete ? (
        <div className="menu-item-actions">
          <small>ID: {item.id}</small>
          <div className="action-buttons">
            {onEdit ? (
              <button className="secondary-btn" onClick={onEdit}>
                Edit
              </button>
            ) : null}
            {onDelete ? (
              <button className="danger-btn" onClick={onDelete}>
                Delete
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export default MenuItemCard;
