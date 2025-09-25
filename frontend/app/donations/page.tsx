'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { donations, products } from '@/lib/data';
import { Gift, Plus, DollarSign, Calendar, User } from 'lucide-react';

export default function Donations() {
  const { user } = useAuth();

  // Calculate donation metrics
  const totalDonations = donations.length;
  const totalValue = donations.reduce((sum, donation) => sum + donation.totalValue, 0);
  const averageDonationValue = totalDonations > 0 ? totalValue / totalDonations : 0;

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'Producto no encontrado';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Donaciones</h1>
            <p className="text-gray-600 mt-1">Registro y seguimiento de donaciones recibidas</p>
          </div>
          <Button className="bg-gradient-to-r from-foundation-orange to-foundation-gold hover:from-foundation-orange/90 hover:to-foundation-gold/90">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Donación
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Donaciones</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{totalDonations}</p>
                </div>
                <div className="p-3 rounded-full bg-foundation-orange/10">
                  <Gift className="h-6 w-6 text-foundation-orange" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">${totalValue.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-full bg-green-50">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Promedio</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">${averageDonationValue.toFixed(2)}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-50">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Donations Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Gift className="h-5 w-5 mr-2 text-foundation-orange" />
              Historial de Donaciones
            </CardTitle>
            <CardDescription>
              Registro completo de todas las donaciones recibidas con sus detalles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {donations.map((donation) => (
                <div key={donation.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-foundation-orange/10">
                          <User className="h-5 w-5 text-foundation-orange" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{donation.donorName}</h3>
                          <p className="text-sm text-gray-500">{donation.donorEmail}</p>
                          {donation.receiptNumber && (
                            <p className="text-xs text-gray-400">Recibo: {donation.receiptNumber}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-14">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Productos Donados:</h4>
                        <div className="space-y-1">
                          {donation.items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">
                                {getProductName(item.productId)} - {item.quantity} unidades
                              </span>
                              <span className="text-gray-500">
                                ${item.unitPrice.toFixed(2)} c/u
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="mb-2">
                        <p className="text-lg font-semibold text-green-600">
                          ${donation.totalValue.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">Valor total</p>
                      </div>
                      <div className="mb-2">
                        <p className="text-sm text-gray-500">
                          {new Date(donation.date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(donation.date).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Ver Detalles
                        </Button>
                        <Button variant="outline" size="sm">
                          Generar Recibo
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
