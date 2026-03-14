import MenuItemCard from './MenuItemCard';

function MenuGrid({ items, onDeleteItem, onEditItem, onItemAction, actionLabel }) {
  if (!items.length) {
    return <p className="empty-state">No menu items found.</p>;
  }

  return (
    <section className="menu-grid">
      {items.map((item) => (
        <MenuItemCard
          key={item.id}
          item={item}
          onEdit={onEditItem ? () => onEditItem(item) : undefined}
          onDelete={onDeleteItem ? () => onDeleteItem(item.id) : undefined}
          onAction={onItemAction ? () => onItemAction(item) : undefined}
          actionLabel={actionLabel}
        />
      ))}
    </section>
  );
}

export default MenuGrid;
