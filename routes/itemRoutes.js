const express = require('express');
const authController = require('../controllers/authcontroller');
const itemController = require('../controllers/itemController');
const validateObj = require('../utils/validation');
const {getLocation} = require('../utils/getLocation');
const {itemValidationCreate , itemValidationUpdate} = require("../utils/validation")

const router = express.Router( { mergeParams: true });
router.get('/', itemController.getAllItems);
router.get('/:id', validateObj.validateParam(['id']),authController.amIloggedIn, itemController.getItem);

router.use(authController.protect);
router.use("/items-within/:distance/center/:latlng/unit/:unit", itemController.getItemsWithin);
router.route('/:id')
    .all(validateObj.validateParam(['id'])) 
    .patch(itemValidationUpdate, itemController.updateItem)
    .delete(itemController.deleteItem);

router.route('/')
    .delete(authController.restrictTo('admin'), itemController.deleteAllItems)
    .post(itemValidationCreate, getLocation, itemController.createItem);
  
module.exports = router;