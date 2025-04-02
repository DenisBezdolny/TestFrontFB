import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OrderList from './components/OrderList';
import OrderDetails from './components/OrderDetails';
import OrderForm from './components/OrderForm';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<OrderList />} />
        <Route path="/orders/new" element={<OrderForm />} />
        <Route path="/orders/edit/:id" element={<OrderForm />} />
        <Route path="/orders/:id" element={<OrderDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
