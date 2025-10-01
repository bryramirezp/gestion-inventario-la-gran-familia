'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { axiosClient } from '@/lib/axiosClient';

interface Categoria { id: string; nombre: string; }
interface Unidad { id: string; nombre: string; abreviatura: string; }
interface Option {
  value: string;
  label: string;
}


export default function NewProduct() {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [unidadId, setUnidadId] = useState('');
  const [stock, setStock] = useState('');
  const [precio, setPrecio] = useState('');

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [loading, setLoading] = useState(false);

  // Traer categorías y unidades desde backend
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const catRes = await axiosClient.get('/categories');
        const uniRes = await axiosClient.get('/units');
        setCategorias(catRes.data || []);
        setUnidades(uniRes.data || []);
      } catch (err) {
        console.error(err);
        alert('No se pudieron cargar categorías/unidades');
      }
    };
    fetchOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axiosClient.post('/products', {
        nombre,
        descripcion,
        categoria_producto_id: Number(categoriaId),
        unidad_medida_id: Number(unidadId),
        stock: Number(stock),
        precio_referencia: Number(precio),
      });

      alert(`Producto "${res.data.nombre}" creado correctamente`);
      // Reset formulario
      setNombre(''); setDescripcion(''); setCategoriaId('');
      setUnidadId(''); setStock(''); setPrecio('');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error al crear producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Registrar Nuevo Producto</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <InputField label="Nombre" value={nombre} onChange={setNombre} required />
          <TextareaField label="Descripción" value={descripcion} onChange={setDescripcion} rows={3} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Categoría"
              value={categoriaId}
              onChange={setCategoriaId}
              options={categorias.map(c => ({ value: c.id, label: c.nombre }))}
              required
            />
            <SelectField
              label="Unidad de medida"
              value={unidadId}
              onChange={setUnidadId}
              options={unidades.map(u => ({ value: u.id, label: `${u.nombre} (${u.abreviatura})` }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Stock inicial" value={stock} onChange={setStock} type="number" min={0} required />
            <InputField label="Precio de referencia" value={precio} onChange={setPrecio} type="number" min={0} step={0.01} required />
          </div>

          <Button type="submit" className="bg-gradient-to-r from-orange-400 to-yellow-400" disabled={loading}>
            {loading ? 'Guardando...' : 'Registrar Producto'}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}

// Componentes reutilizables
const InputField = ({ label, value, onChange, type = 'text', ...props }: any) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <Input value={value} onChange={e => onChange(e.target.value)} type={type} {...props} />
  </div>
);

const TextareaField = ({ label, value, onChange, ...props }: any) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <Textarea value={value} onChange={e => onChange(e.target.value)} {...props} />
  </div>
);

const SelectField = ({
  label,
  value,
  onChange,
  options,
  required,
  ...props
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  required?: boolean;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <select
      className="border rounded px-3 py-2 w-full"
      value={value}
      onChange={e => onChange(e.target.value)}
      required={required}
      {...props}
    >
      <option value="">Seleccione {label.toLowerCase()}</option>
      {options.map((opt: Option) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

