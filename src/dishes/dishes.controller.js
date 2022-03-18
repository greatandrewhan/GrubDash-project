const path = require('path');

// Use the existing dishes data
const dishes = require(path.resolve('src/data/dishes-data'));

// Use this function to assign ID's when necessary
const nextId = require('../utils/nextId');

// create a new dish
function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// list all dishes
function list(req, res) {
  res.status(200).json({ data: dishes });
}

// dish exists
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}

// read all dishes
function read(req, res) {
  res.json({ data: res.locals.dish });
}

// update dish
function update(req, res) {
  const { dishId } = req.params;
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: dishId,
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };
  dishes.push(newDish);
  res.json({ data: newDish });
}

// dish validation
function validateDish(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  if (!name || name === '') {
    return next({
      status: 400,
      message: 'Dish must include a name',
    });
  }
  if (!description || description === '') {
    return next({
      status: 400,
      message: 'Dish must include a description',
    });
  }
  if (!price) {
    return next({
      status: 400,
      message: 'Dish must include a price',
    });
  }
  if (price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: 'Dish must have a price that is an integer greater than 0',
    });
  }
  if (!image_url || image_url === '') {
    return next({
      status: 400,
      message: 'Dish must include a image_url',
    });
  }
  return next();
}

// update validation
function validateUpdate(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;
  if (dishId === id || !id) {
    return next();
  }
  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}.`,
  });
}

module.exports = {
  create: [validateDish, create],
  list,
  read: [dishExists, read],
  update: [dishExists, validateDish, validateUpdate, update],
};
