const path = require('path');

// Use the existing order data
const orders = require(path.resolve('src/data/orders-data'));

// Use this function to assign ID's when necessary
const nextId = require('../utils/nextId');

// create a new order
function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

// read order
function read(req, res) {
  res.json({ data: res.locals.order });
}

// delete order with if status is 'pending' throw error
function destroy(req, res, next) {
  const { orderId } = req.params;
  const { status } = res.locals.order;
  const index = orders.findIndex((order) => order.id === orderId);
  if (index > -1 && status === 'pending') {
    orders.splice(index, 1);
  } else {
    return next({
      status: 400,
      message: 'An order cannot be deleted unless it is pending',
    });
  }
  res.sendStatus(204);
}

// list all orders
function list(req, res) {
  res.json({ data: orders });
}

// order exists
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order with id ${orderId} does not exist`,
  });
}

// update order
function update(req, res) {
  const { id } = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const updatedOrder = {
    id: id,
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };
  res.json({ data: updatedOrder });
}

// order validation
function validateOrder(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  // deliverTo property is missing || deliverTo property is empty ""
  if (!deliverTo || deliverTo === '') {
    next({
      status: 400,
      message: 'Order must include a deliverTo',
    });
  }
  // mobileNumber property is missing || mobileNumber property is empty ""
  if (!mobileNumber || mobileNumber === '') {
    next({
      status: 400,
      message: 'Order must include a mobileNumber',
    });
  }
  // dishes property is missing
  if (!dishes) {
    next({
      status: 400,
      message: 'Order must include a dish',
    });
  }
  // if dishes property is not an array || dishes array is empty
  if (!Array.isArray(dishes) || dishes.length === 0) {
    next({
      status: 400,
      message: 'Order must include at least one dish',
    });
  }

  next();
}

// A dish Quantity Validation
// a dish quantity property is missing || a dish quantity property is zero or less || a dish quantity property is not an integer
function validateDishQty(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  dishes.map((dish, index) => {
    if (
      !dish.quantity ||
      dish.quantity <= 0 ||
      !Number.isInteger(dish.quantity)
    ) {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}

// status validation
function validateStatus(req, res, next) {
  const { orderId } = req.params;
  const { data: { id, status } = {} } = req.body;

  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }

  if (
    !status ||
    status === '' ||
    (status !== 'pending' &&
      status !== 'preparing' &&
      status !== 'out-for-delivery')
  ) {
    return next({
      status: 400,
      message:
        'Order must have a status of pending, preparing, out-for-delivery, delivered',
    });
  }

  if (status === 'delivered') {
    return next({
      status: 400,
      message: 'A delivered order cannot be changed',
    });
  }
  next();
}

module.exports = {
  create: [validateOrder, validateDishQty, create],
  list,
  read: [orderExists, read],
  update: [validateOrder, validateDishQty, orderExists, validateStatus, update],
  delete: [orderExists, destroy],
};
