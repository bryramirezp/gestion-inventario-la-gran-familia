import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { menuApi, getFullProductDetails } from '../../services/api';
import { Menu, NewMenu } from '../../types';
import Header from '../../components/Header';
import { useUserProfile } from '../../hooks/useUserProfile';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '../../components/Card';
import { Button } from '../../components/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/Dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/AlertDialog';
import { Label, Input, Textarea } from '../../components/forms';
import { Combobox } from '../../components/Combobox';
import {
  TrashIcon,
  EditIcon,
  CalendarIcon,
  CubeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../../components/icons/Icons';
import { useAlerts } from '../../contexts/AlertContext';
import { AnimatedWrapper } from '../../components/Animated';
import { DatePicker } from '../../components/DatePicker';
import { useAuth } from '../../contexts/AuthContext';

type ProductDetail = Awaited<ReturnType<typeof getFullProductDetails>>[0];

const MenuForm: React.FC<{
  menu: Partial<NewMenu> | null;
  products: ProductDetail[];
  onSave: (menu: NewMenu) => void;
  onCancel: () => void;
  presetDate?: string;
}> = ({ menu, products, onSave, onCancel, presetDate }) => {
  const [formData, setFormData] = useState<Partial<NewMenu>>(() => {
    const initialData = menu || { title: '', instructions: '', menu_date: '', items: [] };
    if (presetDate && !initialData.menu_date) {
      initialData.menu_date = presetDate;
    }
    return initialData;
  });
  const { addAlert } = useAlerts();

  const productOptions = products.map((p) => ({
    value: p.product_id,
    label: p.product_name,
    details: `Stock: ${p.total_stock} ${p.unit_abbreviation}`,
  }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDateChange = (date: string | null) => {
    setFormData((prev) => ({ ...prev, menu_date: date || '' }));
  };

  const handleItemChange = (index: number, field: 'product_id' | 'quantity', value: any) => {
    const newItems = [...(formData.items || [])];
    const currentItem = newItems[index] || { product_id: 0, quantity: 1 };
    newItems[index] = { ...currentItem, [field]: value };
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const handleAddItem = () => {
    const newItem = { product_id: 0, quantity: 1 };
    setFormData((prev) => ({ ...prev, items: [...(prev.items || []), newItem] }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({ ...prev, items: (prev.items || []).filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.menu_date ||
      (formData.items || []).length === 0 ||
      (formData.items || []).some((item) => !item.product_id)
    ) {
      addAlert('Title, date, and at least one valid ingredient are required.', 'warning');
      return;
    }
    onSave(formData as NewMenu);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="title">Menu Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="menu_date">Date</Label>
            <DatePicker
              selectedDate={formData.menu_date || null}
              onSelectDate={(d) => handleDateChange(d)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="instructions">Recipe / Instructions</Label>
          <Textarea
            id="instructions"
            name="instructions"
            value={formData.instructions || ''}
            onChange={handleChange}
            rows={5}
          />
        </div>
        <div>
          <Label>Ingredients</Label>
          <div className="space-y-3 p-4 border border-border dark:border-dark-border rounded-md bg-muted/30 dark:bg-dark-muted/30 max-h-60 overflow-y-auto">
            {(formData.items || []).length > 0 ? (
              (formData.items || []).map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-grow">
                    <Combobox
                      options={productOptions}
                      value={item.product_id || null}
                      onChange={(val) => handleItemChange(index, 'product_id', val)}
                      placeholder="Select an ingredient..."
                    />
                  </div>
                  <div className="w-24 flex-shrink-0">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, 'quantity', parseFloat(e.target.value))
                      }
                      className="w-full text-center"
                      placeholder="Qty"
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <TrashIcon className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4">
                <p>No ingredients added yet.</p>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="mt-2"
            >
              Add Ingredient
            </Button>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Menu</Button>
      </DialogFooter>
    </form>
  );
};

const NutritionistView: React.FC = () => {
  const { user } = useAuth();
  const { data: userProfile } = useUserProfile();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);
  const { addAlert } = useAlerts();

  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const menusByDate = useMemo(() => {
    return menus.reduce(
      (acc, menu) => {
        acc[menu.menu_date] = menu;
        return acc;
      },
      {} as Record<string, Menu>
    );
  }, [menus]);

  const selectedMenu = useMemo(() => {
    if (!selectedDate) return null;
    const dateStr = selectedDate.toISOString().split('T')[0];
    return menusByDate[dateStr] || null;
  }, [selectedDate, menusByDate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [menuData, productData] = await Promise.all([
        menuApi.getAll(''),
        getFullProductDetails(''),
      ]);
      setMenus(menuData);
      setProducts(productData);
    } catch (error) {
      addAlert('Failed to load data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (menu: Menu | null = null, date?: Date) => {
    setEditingMenu(menu);
    if (date && !menu) {
      // Prefill date for new menu
      setSelectedDate(date);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (menuData: NewMenu) => {
    try {
      if (editingMenu) {
        await menuApi.update('', editingMenu.menu_id, menuData);
        addAlert('Menu updated successfully!', 'success');
      } else {
        await menuApi.create('', menuData);
        addAlert('Menu created successfully!', 'success');
      }
      fetchData();
      setIsModalOpen(false);
      setEditingMenu(null);
    } catch (error) {
      addAlert('Failed to save menu.', 'error');
    }
  };

  const handleDelete = (menu: Menu) => {
    setMenuToDelete(menu);
    setIsAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!menuToDelete) return;
    try {
      await menuApi.delete('', menuToDelete.menu_id);
      addAlert('Menu deleted.', 'success');
      fetchData();
      setSelectedDate(null); // Clear selection after deletion
    } catch (error) {
      addAlert('Failed to delete menu.', 'error');
    } finally {
      setIsAlertOpen(false);
      setMenuToDelete(null);
    }
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => <div key={`blank-${i}`} />);

    return [
      ...blanks,
      ...days.map((day) => {
        const date = new Date(year, month, day);
        const dateStr = date.toISOString().split('T')[0];
        const hasMenu = !!menusByDate[dateStr];
        const isSelected = selectedDate?.getTime() === date.getTime();
        const isToday = date.getTime() === today.getTime();

        return (
          <div
            key={day}
            onClick={() => setSelectedDate(date)}
            className={`p-2 h-24 flex flex-col border border-transparent rounded-lg cursor-pointer transition-colors
                    ${isSelected ? 'bg-primary/20 border-primary' : 'hover:bg-muted dark:hover:bg-dark-muted'}
                    ${isToday ? 'bg-accent dark:bg-dark-accent' : 'bg-card dark:bg-dark-card-hover'}
                `}
          >
            <span className={`font-semibold ${isToday ? 'text-primary' : ''}`}>{day}</span>
            {hasMenu && (
              <div className="mt-auto text-xs font-semibold p-1 rounded bg-primary/80 text-primary-foreground truncate">
                {menusByDate[dateStr].title}
              </div>
            )}
          </div>
        );
      }),
    ];
  };

  if (loading) return <div>Loading Nutritionist View...</div>;

  return (
    <AnimatedWrapper>
      <Header
        title="Menu Planning"
        description="Create and manage daily menus for the kitchen."
        buttonText="Create New Menu"
        onButtonClick={() => handleOpenModal()}
      />

      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Card className="flex-grow w-full md:w-2/3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() - 1)))}
              >
                <ChevronLeftIcon />
              </Button>
              <CardTitle className="text-center">
                {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + 1)))}
              >
                <ChevronRightIcon />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-muted-foreground mt-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">{renderCalendar()}</div>
          </CardContent>
        </Card>

        <Card className="w-full md:w-1/3 sticky top-6">
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? selectedDate.toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Select a Date'}
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-[200px]">
            {selectedMenu ? (
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-primary">{selectedMenu.title}</h3>
                <div>
                  <h4 className="font-semibold text-sm">Instructions</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">
                    {selectedMenu.instructions || 'No instructions provided.'}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Ingredients</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-1">
                    {selectedMenu.items.map((item) => {
                      const product = products.find((p) => p.product_id === item.product_id);
                      return (
                        <li key={item.product_id}>
                          {item.quantity} {product?.unit_abbreviation} - {product?.product_name}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenModal(selectedMenu)}>
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(selectedMenu)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ) : selectedDate ? (
              <div className="text-center text-muted-foreground py-8 flex flex-col items-center gap-3">
                <CalendarIcon className="w-10 h-10 opacity-50" />
                <p className="font-medium">No menu planned.</p>
                <Button onClick={() => handleOpenModal(null, selectedDate)}>Create Menu</Button>
              </div>
            ) : (
              <p className="text-muted-foreground text-center pt-8">
                Select a date from the calendar to view or create a menu.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingMenu ? 'Edit Menu' : 'Create New Menu'}</DialogTitle>
          </DialogHeader>
          <MenuForm
            menu={editingMenu}
            products={products}
            onSave={handleSave}
            onCancel={() => setIsModalOpen(false)}
            presetDate={
              !editingMenu && selectedDate ? selectedDate.toISOString().split('T')[0] : undefined
            }
          />
        </DialogContent>
      </Dialog>

      <AlertDialog isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the menu "{menuToDelete?.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsAlertOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatedWrapper>
  );
};

export default NutritionistView;
