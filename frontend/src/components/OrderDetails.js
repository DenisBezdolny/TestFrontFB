import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [itemFilters, setItemFilters] = useState({
    name: '',
    unit: ''
  });
  const [sort, setSort] = useState({
    field: 'id',       // Возможные значения: "id", "name", "quantity", "unit"
    direction: 'asc'
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrder();
    fetchOrderItems();
  }, [id]);

  // Загружаем заказ
  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Ошибка получения заказа:', error);
    }
  };

  // Загружаем элементы заказа с учетом фильтров
  const fetchOrderItems = async () => {
    try {
      const params = {
        orderId: id,
        name: itemFilters.name,
        unit: itemFilters.unit
      };
      const response = await api.get('/orderItems', { params });
      setOrderItems(response.data);
      // Применяем сортировку сразу после загрузки
      sortItems(response.data, sort);
    } catch (error) {
      console.error('Ошибка получения элементов заказа:', error);
    }
  };

  // Фильтрация элементов (можно также вызвать fetchOrderItems для серверной фильтрации)
  const applyFilters = () => {
    fetchOrderItems();
  };

  // Сортировка элементов по выбранному полю и направлению (на клиенте)
  const sortItems = (items, sortOptions) => {
    const sorted = [...items].sort((a, b) => {
      let valA = a[sortOptions.field];
      let valB = b[sortOptions.field];
      // Если сортируем по имени или единице измерения, сравниваем строки
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return sortOptions.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortOptions.direction === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredItems(sorted);
  };

  // Обновляем сортировку при изменении параметров
  const handleSortChange = (e) => {
    const newSort = { ...sort, field: e.target.value };
    setSort(newSort);
    sortItems(orderItems, newSort);
  };

  const toggleSortDirection = () => {
    const newSort = { ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' };
    setSort(newSort);
    sortItems(orderItems, newSort);
  };

  // Обработка изменения фильтров для элементов заказа
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setItemFilters({ ...itemFilters, [name]: value });
  };

  const deleteOrder = async () => {
    try {
      await api.delete(`/orders/${id}`);
      navigate('/');
    } catch (error) {
      console.error('Ошибка удаления заказа:', error);
    }
  };

  if (!order) return <div>Загрузка...</div>;

  return (
    <div className="container my-4">
      <h1 className="mb-3">Детали заказа</h1>
      <div className="mb-3">
        <p><strong>ID:</strong> {order.id}</p>
        <p><strong>Номер заказа:</strong> {order.number}</p>
        <p><strong>Дата:</strong> {new Date(order.date).toLocaleDateString()}</p>
        <p><strong>Поставщик ID:</strong> {order.providerId}</p>
      </div>
      
      <h2 className="mb-3">Элементы заказа</h2>
      
      {/* Панель фильтров для OrderItems */}
      <div className="mb-3">
        <div className="form-group mb-2">
          <label htmlFor="filterName">Наименование:</label>
          <input
            type="text"
            id="filterName"
            name="name"
            className="form-control"
            placeholder="Фильтр по наименованию"
            value={itemFilters.name}
            onChange={handleFilterChange}
          />
        </div>
        <div className="form-group mb-2">
          <label htmlFor="filterUnit">Единица измерения:</label>
          <input
            type="text"
            id="filterUnit"
            name="unit"
            className="form-control"
            placeholder="Фильтр по единице измерения"
            value={itemFilters.unit}
            onChange={handleFilterChange}
          />
        </div>
        <button className="btn btn-primary mb-2" onClick={applyFilters}>
          Применить фильтр
        </button>
      </div>
      
      {/* Панель сортировки для OrderItems */}
      <div className="mb-3">
        <label className="me-2">Сортировать по:</label>
        <select value={sort.field} onChange={handleSortChange} className="form-select d-inline w-auto me-2">
          <option value="id">ID</option>
          <option value="name">Наименованию</option>
          <option value="quantity">Количеству</option>
          <option value="unit">Единице измерения</option>
        </select>
        <button className="btn btn-secondary" onClick={toggleSortDirection}>
          {sort.direction === 'asc' ? 'По убыванию' : 'По возрастанию'}
        </button>
      </div>
      
      {/* Таблица OrderItems */}
      {filteredItems.length > 0 ? (
        <table className="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Наименование</th>
              <th>Количество</th>
              <th>Единица измерения</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{item.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Элементы заказа отсутствуют</p>
      )}

      <div className="mt-3">
        <Link to={`/orders/edit/${order.id}`}>
          <button className="btn btn-warning me-2">Редактировать</button>
        </Link>
        <button className="btn btn-danger me-2" onClick={deleteOrder}>
          Удалить
        </button>
        <Link to="/">
          <button className="btn btn-primary">Вернуться к списку заказов</button>
        </Link>
      </div>
    </div>
  );
};

export default OrderDetails;
