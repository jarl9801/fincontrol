import { useState, useEffect, useMemo } from 'react';

export const useFilters = (transactions) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    project: '',
    category: '',
    type: '',
    status: '',
    quickFilter: 'all'
  });
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  // Apply quick filters
  useEffect(() => {
    const today = new Date();
    let dateFrom = '';
    let dateTo = '';

    switch (filters.quickFilter) {
      case 'month':
        dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        dateTo = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        dateFrom = new Date(today.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
        dateTo = new Date(today.getFullYear(), quarter * 3 + 3, 0).toISOString().split('T')[0];
        break;
      case 'year':
        dateFrom = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        dateTo = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
        break;
      default:
        dateFrom = '';
        dateTo = '';
    }

    setFilters(prev => ({ ...prev, dateFrom, dateTo }));
  }, [filters.quickFilter]);

  const applyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (appliedFilters.dateFrom) {
      filtered = filtered.filter(t => t.date >= appliedFilters.dateFrom);
    }
    if (appliedFilters.dateTo) {
      filtered = filtered.filter(t => t.date <= appliedFilters.dateTo);
    }
    if (appliedFilters.project) {
      filtered = filtered.filter(t => t.project === appliedFilters.project);
    }
    if (appliedFilters.category) {
      filtered = filtered.filter(t => t.category === appliedFilters.category);
    }
    if (appliedFilters.type) {
      filtered = filtered.filter(t => t.type === appliedFilters.type);
    }
    if (appliedFilters.status) {
      filtered = filtered.filter(t => t.status === appliedFilters.status);
    }

    return filtered;
  }, [transactions, appliedFilters, searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    appliedFilters,
    applyFilters,
    filteredTransactions
  };
};
