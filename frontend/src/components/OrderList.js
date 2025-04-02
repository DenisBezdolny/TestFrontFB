import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { format, subMonths } from 'date-fns';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [providers, setProviders] = useState([]);
  const [filters, setFilters] = useState({
    number: '',
    startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    providerIds: []
  });
  
  // Состояние сортировки для заказов: по умолчанию сортировка по id по возрастанию
  const [sort, setSort] = useState({
    field: 'id',
    direction: 'asc'
  });

  useEffect(() => {
    fetchOrders();
    fetchProviders();
  }, []);

  const fetchOrders = async () => {
    try {
      const params = {
        number: filters.number,
        startDate: filters.startDate,
        endDate: filters.endDate
      };
      if (filters.providerIds.length > 0) {
        params.providerId = filters.providerIds.join(',');
      }
      const response = await api.get('/orders', { params });
      setOrders(response.data);
    } catch (error) {
      console.error('Ошибка получения заказов:', error);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await api.get('/providers');
      setProviders(response.data);
    } catch (error) {
      console.error('Ошибка получения поставщиков:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, selectedOptions } = e.target;
    if (type === 'select-multiple') {
      const values = Array.from(selectedOptions, option => option.value);
      setFilters({ ...filters, [name]: values });
    } else {
      setFilters({ ...filters, [name]: value });
    }
  };

  const applyFilters = () => {
    fetchOrders();
  };

  // Клиентская сортировка заказов с корректным сравнением
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      let valA = a[sort.field];
      let valB = b[sort.field];

      if (sort.field === 'id' || sort.field === 'providerId') {
        valA = Number(valA);
        valB = Number(valB);
      } else if (sort.field === 'date') {
        valA = new Date(valA);
        valB = new Date(valB);
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [orders, sort]);

  const handleSortFieldChange = (e) => {
    setSort({ ...sort, field: e.target.value });
  };

  const toggleSortDirection = () => {
    setSort({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
  };

  // Функция для получения имени поставщика по его id
  const getProviderName = (providerId) => {
    const provider = providers.find(p => Number(p.id) === Number(providerId));
    return provider ? provider.name : providerId;
  };

  return (
    <div className="container my-4">
      <h1>Список заказов</h1>
      <div className="mb-3">
        <Link to="/orders/new">
          <button className="btn btn-primary">Добавить заказ</button>
        </Link>
      </div>
      <div className="mb-3">
        <div className="form-group mb-2">
          <label>Номер заказа:</label>
          <input 
            type="text" 
            name="number" 
            value={filters.number} 
            onChange={handleFilterChange} 
            placeholder="Номер заказа"
            className="form-control"
          />
        </div>
        <div className="form-group mb-2">
          <label>Период:</label>
          <input 
            type="date" 
            name="startDate" 
            value={filters.startDate} 
            onChange={handleFilterChange}
            className="form-control d-inline w-auto me-2"
          />
          <span className="mx-2">-</span>
          <input 
            type="date" 
            name="endDate" 
            value={filters.endDate} 
            onChange={handleFilterChange}
            className="form-control d-inline w-auto"
          />
        </div>
        <div className="form-group mb-2">
          <label>Поставщики:</label>
          <select 
            name="providerIds" 
            multiple 
            value={filters.providerIds} 
            onChange={handleFilterChange}
            className="form-select"
          >
            {providers.map((provider, index) => (
              <option key={provider.id !== 0 ? provider.id : `provider-${index}`} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </div>
        <button onClick={applyFilters} className="btn btn-primary">
          Применить фильтр
        </button>
      </div>
      
      {/* Панель сортировки */}
      <div className="mb-3 d-flex align-items-center">
        <label className="me-2">Сортировать по:</label>
        <select value={sort.field} onChange={handleSortFieldChange} className="form-select w-auto me-2">
          <option value="id">ID</option>
          <option value="number">Номер заказа</option>
          <option value="date">Дата</option>
          <option value="providerId">Поставщик</option>
        </select>
        <button onClick={toggleSortDirection} className="btn btn-secondary">
          {sort.direction === 'asc' ? 'По убыванию' : 'По возрастанию'}
        </button>
      </div>
      
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Номер заказа</th>
            <th>Дата</th>
            <th>Поставщик</th>
          </tr>
        </thead>
        <tbody>
          {sortedOrders.length > 0 ? (
            sortedOrders.map((orderItem, index) => (
              <tr key={orderItem.id !== 0 ? orderItem.id : `order-${index}`}>
                <td>{orderItem.id}</td>
                <td>
                  <Link to={`/orders/${orderItem.id}`}>{orderItem.number}</Link>
                </td>
                <td>{new Date(orderItem.date).toLocaleDateString()}</td>
                <td>{getProviderName(orderItem.providerId)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">Нет заказов</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrderList;
