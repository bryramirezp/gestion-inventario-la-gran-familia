'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { kpis } from '@/lib/data';
import { FileText, TrendingUp, Target, AlertCircle } from 'lucide-react';

export default function KPIs() {
  const { user } = useAuth();

  const getKPIStatus = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    if (percentage >= 100) return { status: 'excellent', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (percentage >= 80) return { status: 'good', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    if (percentage >= 60) return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { status: 'critical', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const getKPIIcon = (category: string) => {
    switch (category) {
      case 'consumption':
        return <TrendingUp className="h-5 w-5" />;
      case 'waste':
        return <AlertCircle className="h-5 w-5" />;
      case 'efficiency':
        return <Target className="h-5 w-5" />;
      case 'cost':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Indicadores de Rendimiento (KPIs)</h1>
            <p className="text-gray-600 mt-1">Métricas clave para evaluar el desempeño del sistema</p>
          </div>
          <Button className="bg-gradient-to-r from-foundation-orange to-foundation-gold hover:from-foundation-orange/90 hover:to-foundation-gold/90">
            <FileText className="w-4 h-4 mr-2" />
            Configurar KPIs
          </Button>
        </div>

        {/* KPI Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total KPIs</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.length}</p>
                </div>
                <div className="p-3 rounded-full bg-foundation-orange/10">
                  <FileText className="h-6 w-6 text-foundation-orange" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Meta</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {kpis.filter(kpi => (kpi.value / kpi.target) >= 1).length}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-50">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Requieren Atención</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">
                    {kpis.filter(kpi => (kpi.value / kpi.target) < 0.8).length}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-yellow-50">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Promedio General</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {Math.round((kpis.reduce((sum, kpi) => sum + (kpi.value / kpi.target), 0) / kpis.length) * 100)}%
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-50">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPI Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-foundation-orange" />
              Indicadores Detallados
            </CardTitle>
            <CardDescription>
              Seguimiento detallado de todos los indicadores de rendimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {kpis.map((kpi) => {
                const status = getKPIStatus(kpi.value, kpi.target);
                const percentage = (kpi.value / kpi.target) * 100;

                return (
                  <div key={kpi.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${status.bgColor}`}>
                          {getKPIIcon(kpi.category)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{kpi.name}</h3>
                          <p className="text-sm text-gray-500 capitalize">
                            {kpi.category} • {kpi.period}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {kpi.value}/{kpi.target}
                        </p>
                        <p className="text-sm text-gray-500">
                          {percentage.toFixed(1)}% de la meta
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progreso hacia la meta</span>
                        <span className={`font-medium ${status.color}`}>
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(percentage, 100)} 
                        className="h-2"
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <Badge className={status.bgColor}>
                        {status.status === 'excellent' && 'Excelente'}
                        {status.status === 'good' && 'Bueno'}
                        {status.status === 'warning' && 'Requiere Atención'}
                        {status.status === 'critical' && 'Crítico'}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        Actualizado: {new Date(kpi.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
