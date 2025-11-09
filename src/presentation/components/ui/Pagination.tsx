import React from 'react';
import { Button } from '@/presentation/components/ui/Button';
import { ChevronLeftIcon, ChevronRightIcon } from '@/presentation/components/icons/Icons';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) {
    return null;
  }

  const handlePrev = () => {
    onPageChange(Math.max(1, currentPage - 1));
  };

  const handleNext = () => {
    onPageChange(Math.min(totalPages, currentPage + 1));
  };

  return (
    <div className="flex items-center justify-between mt-6">
      <Button variant="outline" onClick={handlePrev} disabled={currentPage === 1}>
        <ChevronLeftIcon className="h-4 w-4 mr-2" />
        Anterior
      </Button>
      <span className="text-sm text-muted-foreground dark:text-dark-muted-foreground">
        Página {currentPage} de {totalPages}
      </span>
      <Button variant="outline" onClick={handleNext} disabled={currentPage === totalPages}>
        Siguiente
        <ChevronRightIcon className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
};

export default Pagination;
