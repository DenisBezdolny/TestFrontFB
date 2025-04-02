import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const OrderForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  // Начальное состояние заказа включает providerId как строку.
  const [order, setOrder] = useState({
    number: '',
    date: '',
    providerId: ''
    // id можно установить позже при редактировании
  });
  const [orderItems, setOrderItems] = useState([]);
  const [providers, setProviders] = useState([]);

  // Состояние сортировки для OrderItems
  const [sort, setSort] = useState({
    field: 'id',       // По умолчанию сортировка по id
    direction: 'asc'
  });

  useEffect(() => {
    fetchProviders();
    if (isEditMode) {
      fetchOrder();
      fetchOrderItems();
    }
  }, [id]);

  const fetchProviders = async () => {
    try {
      const response = await api.get('/providers');
      setProviders(response.data);
    } catch (error) {
      console.error('Ошибка получения поставщиков:', error);
    }
  };

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${id}`);
      const data = response.data;
      // Форматируем дату для input (если приходит в формате ISO)
      const formattedDate = data.date ? data.date.split('T')[0] : '';
      // Включаем id в объект, а также приводим providerId к строке
      setOrder({ id: data.id, ...data, date: formattedDate, providerId: data.providerId.toString() });
    } catch (error) {
      console.error('Ошибка получения заказа:', error);
    }
  };

  const fetchOrderItems = async () => {
    try {
      const response = await api.get('/orderItems', { params: { orderId: id } });
      setOrderItems(response.data);
    } catch (error) {
      console.error('Ошибка получения элементов заказа:', error);
    }
  };

  // Обновление данных заказа
  const handleOrderChange = (e) => {
    const { name, value } = e.target;
    setOrder({
      ...order,
      [name]: value
    });
  };

  // Обновление данных OrderItem по индексу
  const handleOrderItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...orderItems];
    newItems[index] = { ...newItems[index], [name]: value };
    setOrderItems(newItems);
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { name: '', quantity: '', unit: '' }]);
  };

  const removeOrderItem = (index) => {
    const newItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(newItems);
  };

  // Сортировка элементов заказа на клиенте с использованием useMemo
  const sortedItems = useMemo(() => {
    return [...orderItems].sort((a, b) => {
      let valA = a[sort.field];
      let valB = b[sort.field];
      // Если сортируем по строковому значению, приводим к нижнему регистру
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [orderItems, sort]);

  // Обработка изменения сортировки
  const handleSortFieldChange = (e) => {
    const newSort = { ...sort, field: e.target.value };
    setSort(newSort);
  };

  const toggleSortDirection = () => {
    const newSort = { ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' };
    setSort(newSort);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        // Обновление заказа
        const orderToUpdate = {
          ...order,
          id: parseInt(order.id, 10),
          providerId: parseInt(order.providerId, 10)
        };
        console.log("Актуальный order.id:", order.id);
        console.log("Отправляем PUT-запрос с объектом:", orderToUpdate);
        await api.put(`/orders/${id}`, orderToUpdate);
        // Обновляем или создаём элементы заказа
        for (const item of orderItems) {
          if (item.id) {
            await api.put(`/orderItems/${item.id}`, { ...item, orderId: order.id });
          } else {
            await api.post('/orderItems', { ...item, orderId: order.id });
          }
        }
      } else {
        // Создание нового заказа – отправляем объединённый JSON
        const orderToCreate = {
          ...order,
          providerId: parseInt(order.providerId, 10),
          orderItems: orderItems
        };
        const orderResponse = await api.post('/orders', orderToCreate);
      }
      navigate('/');
    } catch (error) {
      console.error('Ошибка сохранения заказа:', error);
      alert('Ошибка сохранения заказа. Проверьте данные и попробуйте снова.');
    }
  };

  return (
    <div className="container my-4">
      <h1>{isEditMode ? 'Редактировать заказ' : 'Создать заказ'}</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group mb-3">
          <label>Номер заказа:</label>
          <input 
            type="text" 
            name="number" 
            value={order.number} 
            onChange={handleOrderChange} 
            required
            className="form-control"
          />
        </div>
        <div className="form-group mb-3">
          <label>Дата:</label>
          <input 
            type="date" 
            name="date" 
            value={order.date} 
            onChange={handleOrderChange} 
            required
            className="form-control"
          />
        </div>
        <div className="form-group mb-3">
          <label>Поставщик:</label>
          <select 
            name="providerId" 
            value={order.providerId} 
            onChange={handleOrderChange} 
            required
            className="form-select"
          >
            <option value="">Выберите поставщика</option>
            {providers.map((provider, idx) => (
              <option
                key={(provider.id == null || provider.id === 0 || provider.id === "0")
                      ? `provider-${idx}`
                      : provider.id}
                value={provider.id}
              >
                {provider.name}
              </option>
            ))}
          </select>
        </div>
        
        <h2>Элементы заказа</h2>
        
        {/* Панель сортировки для OrderItems */}
        <div className="d-flex align-items-center mb-3">
          <label className="me-2">Сортировать по:</label>
          <select value={sort.field} onChange={handleSortFieldChange} className="form-select w-auto me-2">
            <option value="id">ID</option>
            <option value="name">Наименованию</option>
            <option value="quantity">Количеству</option>
            <option value="unit">Единице измерения</option>
          </select>
          <button type="button" className="btn btn-secondary" onClick={toggleSortDirection}>
            {sort.direction === 'asc' ? 'По убыванию' : 'По возрастанию'}
          </button>
        </div>
        
        {/* Список OrderItems */}
        {sortedItems.length > 0 ? (
          sortedItems.map((item, index) => (
            <div
              key={(item.id == null || item.id === 0 || item.id === "0")
                    ? `new-${index}`
                    : item.id}
              className="border p-3 mb-3"
            >
              <div className="form-group mb-2">
                <label>Наименование:</label>
                <input 
                  type="text" 
                  name="name" 
                  value={item.name} 
                  onChange={(e) => handleOrderItemChange(index, e)} 
                  required
                  className="form-control"
                />
              </div>
              <div className="form-group mb-2">
                <label>Количество:</label>
                <input 
                  type="number" 
                  step="0.001"
                  name="quantity" 
                  value={item.quantity} 
                  onChange={(e) => handleOrderItemChange(index, e)} 
                  required
                  className="form-control"
                />
              </div>
              <div className="form-group mb-2">
                <label>Единица измерения:</label>
                <input 
                  type="text" 
                  name="unit" 
                  value={item.unit} 
                  onChange={(e) => handleOrderItemChange(index, e)} 
                  required
                  className="form-control"
                />
              </div>
              <button type="button" className="btn btn-danger" onClick={() => removeOrderItem(index)}>
                Удалить элемент
              </button>
            </div>
          ))
        ) : (
          <p>Элементы заказа отсутствуют</p>
        )}
        
        <button type="button" onClick={addOrderItem} className="btn btn-primary">
          Добавить элемент заказа
        </button>
        
        <div className="mt-4">
          <button type="submit" className="btn btn-success">Сохранить заказ</button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
