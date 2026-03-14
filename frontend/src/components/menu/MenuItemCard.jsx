import { formatCurrency } from '../../utils/formatCurrency';

function MenuItemCard({ item, onEdit, onDelete }) {
  return (
    <article className="menu-item-card">
      <div className="menu-item-header">
        <h3>{item.name}</h3>
        <span className="menu-price">{formatCurrency(item.price)}</span>
      </div>

      <p className="menu-category">{item.category_name || 'Uncategorized'}</p>
      {item.description ? <p className="menu-description">{item.description}</p> : null}

      <div className="menu-item-actions">
        <small>ID: {item.id}</small>
        <div className="action-buttons">
          <button className="secondary-btn" onClick={onEdit}>
            Edit
          </button>
          <button className="danger-btn" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default MenuItemCard;
