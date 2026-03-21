import MenuItemCard from './MenuItemCard';

function MenuGrid({
  items,
  onDeleteItem,
  onEditItem,
  onItemAction,
  actionLabel,
  cardClickable,
  hideActionButton,
  editingItemId,
  onUpdateItem,
  onCancelEdit,
  formData,
  setFormData,
  categories,
}) {
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
          cardClickable={cardClickable}
          hideActionButton={hideActionButton}
          isEditing={editingItemId === item.id}
          onUpdateItem={onUpdateItem}
          onCancelEdit={onCancelEdit}
          formData={formData}
          setFormData={setFormData}
          categories={categories}
        />
      ))}
    </section>
  );
}

export default MenuGrid;
