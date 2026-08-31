import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";

export const addMenuItem = async (req, res, next) => {
  try {
    const { restaurant_id, name, price, category } = req.body;

    const restaurant = await Restaurant.findByPk(restaurant_id);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    if (restaurant.owner_id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const imagePath = req.file ? req.file.path : 'https://loremflickr.com';

    const menuItem = await MenuItem.create({
      restaurant_id,
      name,
      price,
      category,
      image: imagePath
    });

    return res.status(201).json({
      success: true,
      message: "Menu item added successfully",
      menuItem
    });
  } catch (err) {
    console.error("Error in addMenuItem:", err);
    next(err);
  }
};

export const updateMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, price, category } = req.body;

    const menuItem = await MenuItem.findByPk(id, {
      include: [{ model: Restaurant, as: 'restaurant' }]
    });

    if (!menuItem) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    if (menuItem.restaurant.owner_id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (req.file) {
      menuItem.image = req.file.path;
    }

    await menuItem.update({ name, price, category });

    return res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      menuItem
    });
  } catch (err) {
    console.error("Error in updateMenuItem:", err);
    next(err);
  }
};

export const deleteMenuItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findByPk(id, {
      include: [{ model: Restaurant, as: 'restaurant' }]
    });

    if (!menuItem) {
      return res.status(404).json({ success: false, message: "Menu item not found" });
    }

    if (menuItem.restaurant.owner_id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    await menuItem.destroy();

    return res.status(200).json({
      success: true,
      message: "Menu item deleted successfully"
    });
  } catch (err) {
    console.error("Error in deleteMenuItem:", err);
    next(err);
  }
};
