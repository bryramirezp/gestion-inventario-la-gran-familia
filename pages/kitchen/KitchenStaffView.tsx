import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { kitchenApi, getFullProductDetails } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../hooks/useUserProfile';
// Menu type removed since menuApi is no longer used
import Header from '../../components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/Card';
import { Button } from '../../components/Button';
import { Label, Input, Textarea, FormError } from '../../components/forms';
import { useAlerts } from '../../contexts/AlertContext';
import { AnimatedWrapper } from '../../components/Animated';
import { ChefHatIcon } from '../../components/icons/Icons';
import { useNotifications } from '../../contexts/NotificationContext';
import Table, { Column } from '../../components/Table';
import { Badge } from '../../components/Badge';
import useTableState from '../../hooks/useTableState';

type ProductDetail = Awaited<ReturnType<typeof getFullProductDetails>>[0];
type TransactionDetail = Awaited<ReturnType<typeof kitchenApi.getTransactions>>[0];

const getStatusBadge = (status: TransactionDetail['status']) => {
  switch (status) {
    case 'Pending':
      return <Badge variant="warning">Pending</Badge>;
    case 'Approved':
      return <Badge variant="primary">Approved</Badge>;
    case 'Completed':
      return <Badge variant="success">Completed</Badge>;
    case 'Rejected':
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const KitchenStaffView: React.FC = () => {
  const { data: userProfile } = useUserProfile();
  const { addAlert } = useAlerts();
  const { refreshNotifications } = useNotifications();
  const [todayMenu, setTodayMenu] = useState<any | null>(null);
  const [products, setProducts] = useState<ProductDetail[]>([]);
  const [requestHistory, setRequestHistory] = useState<TransactionDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const [servings, setServings] = useState(1);
  const [notes, setNotes] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const [prods, transactions] = await Promise.all([
        getFullProductDetails('', userProfile.warehouse_access[0]),
        kitchenApi.getTransactions(''),
      ]);

      const today = new Date();
      const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
      const todayStr = localDate.toISOString().split('T')[0];

      // Since menuApi is removed, set todayMenu to null for now
      setTodayMenu(null);
      setProducts(prods);
      setRequestHistory(transactions.filter((t) => t.requester_id === userProfile.user_id));
    } catch (error) {
      // Error al cargar datos de cocina - manejado por el sistema de alertas
    } finally {
      setLoading(false);
    }
  }, [addAlert, userProfile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const productMap = useMemo(() => new Map(products.map((p) => [p.product_id, p])), [products]);

  const validateRequest = () => {
    const errors: Record<string, string> = {};
    if (servings <= 0) {
      errors.servings = 'Number of servings must be greater than 0.';
    }
    if (!isConfirmed) {
      errors.confirmation = 'Debe aceptar la responsabilidad para enviar la solicitud.';
    }

    todayMenu?.items.forEach((item) => {
      const product = productMap.get(item.product_id);
      const requiredQty = item.quantity * servings;
      if (product && product.total_stock < requiredQty) {
        errors.items = `Not enough stock for ${product.product_name}. Required: ${requiredQty}, Available: ${product.total_stock}.`;
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRequest() || !todayMenu || !userProfile) return;

    const confirmationText =
      'Acepto que solicité estos productos y que cualquier problema o incumplimiento es mi responsabilidad.';
    const requestItems = todayMenu.items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity * servings,
    }));

    try {
      await kitchenApi.createRequest(
        '',
        userProfile.user_id,
        userProfile.warehouse_access[0],
        requestItems,
        notes,
        confirmationText
      );
      addAlert('Request submitted successfully!', 'success');
      await refreshNotifications();
      await fetchData();
      setServings(1);
      setNotes('');
      setIsConfirmed(false);
      setFormErrors({});
    } catch (error) {
      // Error al enviar solicitud - manejado por el sistema de alertas
    }
  };

  const historyColumns: Column<TransactionDetail>[] = useMemo(
    () => [
      { header: 'ID', accessor: 'transaction_id' },
      { header: 'Date', accessor: (item) => new Date(item.transaction_date).toLocaleDateString() },
      { header: 'Status', accessor: (item) => getStatusBadge(item.status) },
      { header: 'Items', accessor: (item) => item.details.length },
    ],
    []
  );

  const { orderedColumns, ...tableState } = useTableState<TransactionDetail>(
    historyColumns,
    'kitchen-staff-history'
  );

  if (loading) return <div>Loading Kitchen View...</div>;

  return (
    <AnimatedWrapper>
      <Header title="Kitchen Dashboard" description="Today's menu and product requests." />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHatIcon className="w-6 h-6 text-primary" /> Menu of the Day
              </CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayMenu ? (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-foreground">{todayMenu.title}</h3>
                  <div>
                    <h4 className="font-semibold mb-2">Instructions:</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {todayMenu.instructions}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Ingredients (for 1 serving):</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {todayMenu.items.map((item) => {
                        const product = productMap.get(item.product_id);
                        return (
                          <li key={item.product_id}>
                            {item.quantity} {product?.unit_abbreviation || 'units'} -{' '}
                            {product?.product_name || 'Unknown Product'}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No menu has been set for today.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <form onSubmit={handleSubmitRequest}>
            <Card>
              <CardHeader>
                <CardTitle>Request Ingredients</CardTitle>
                <CardDescription>
                  Request the necessary ingredients based on today's menu.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {todayMenu ? (
                  <>
                    <div>
                      <Label htmlFor="servings">Number of Servings</Label>
                      <Input
                        id="servings"
                        type="number"
                        min="1"
                        value={servings}
                        onChange={(e) => setServings(Number(e.target.value) || 1)}
                        className="w-32"
                        error={!!formErrors.servings}
                      />
                      <FormError message={formErrors.servings} />
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm mb-2">Required Ingredients:</h4>
                      <div className="p-4 rounded-md border border-border bg-muted/50 text-sm space-y-2">
                        {todayMenu.items.map((item) => {
                          const product = productMap.get(item.product_id);
                          const required = item.quantity * servings;
                          const available = product?.total_stock || 0;
                          const hasEnough = available >= required;
                          return (
                            <div
                              key={item.product_id}
                              className="flex justify-between items-center"
                            >
                              <span>{product?.product_name || '...'}</span>
                              <span
                                className={`font-mono px-2 py-0.5 rounded ${hasEnough ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}
                              >
                                {required} / {available} {product?.unit_abbreviation}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <FormError message={formErrors.items} />
                    </div>

                    <div>
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g., for tomorrow's prep"
                      />
                    </div>

                    <div className="pt-2">
                      <div className="flex items-start space-x-3">
                        <input
                          id="confirmation"
                          type="checkbox"
                          checked={isConfirmed}
                          onChange={(e) => setIsConfirmed(e.target.checked)}
                          className="h-5 w-5 rounded border-border text-primary focus:ring-primary mt-1 cursor-pointer"
                        />
                        <Label htmlFor="confirmation" className="mb-0 font-normal cursor-pointer">
                          Acepto que solicité estos productos y que cualquier problema o
                          incumplimiento es mi responsabilidad.
                        </Label>
                      </div>
                      <FormError message={formErrors.confirmation} className="ml-8" />
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Button type="submit">Submit Request</Button>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Cannot create a request without a menu for today.
                  </p>
                )}
              </CardContent>
            </Card>
          </form>
        </div>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
            <CardDescription>A history of your ingredient requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table
              columns={orderedColumns}
              data={requestHistory}
              getKey={(t) => t.transaction_id}
              {...tableState}
            />
          </CardContent>
        </Card>
      </div>
    </AnimatedWrapper>
  );
};

export default KitchenStaffView;
