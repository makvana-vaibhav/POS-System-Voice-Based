import MenuItemCard from './MenuItemCard';

function MenuGrid({ items, onDeleteItem, onEditItem }) {
  if (!items.length) {
    return <p className="empty-state">No menu items found.</p>;
  }

  return (
    <section className="menu-grid">
      {items.map((item) => (
        <MenuItemCard
          key={item.id}
          item={item}
          onEdit={() => onEditItem(item)}
          onDelete={() => onDeleteItem(item.id)}
        />
      ))}
    </section>
  );
}

export default MenuGrid;
