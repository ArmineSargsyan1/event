import sequelize from "../clients/db.sequelize.mysql.js";
import { Op, fn, col, literal, Sequelize  } from "sequelize";

import Room from "../models/Room.js";
import Amenity from "../models/Amenity.js";
import RoomOption from "../models/RoomOption.js";
import RoomExtra from "../models/RoomExtra.js";
import Photo from "../models/Photo.js";
import Hotels from "../models/Hotels.js";
import Booking from "../models/Booking.js";
import dayjs from "dayjs";
import HotelPhotos from "../models/HotelPhotos.js";



/* =========================================================
   CREATE ROOM
========================================================= */

export const createRoom = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    let {
      hotel_id,
      name,
      size,
      bed_type,
      max_guests,
      price,
      status = "active",
      amenities = [],
      options = [],
      extras = [],
    } = req.body;

    // ✅ parse JSON
    if (typeof amenities === "string") amenities = JSON.parse(amenities);
    if (typeof options === "string") options = JSON.parse(options);
    if (typeof extras === "string") extras = JSON.parse(extras);

    // ======================
    // 1. CREATE ROOM
    // ======================
    const room = await Room.create(
      {
        hotel_id: Number(hotel_id),
        name,
        size: Number(size),
        bed_type,
        max_guests: Number(max_guests),
        price: Number(price),
        status,
      },
      { transaction: t }
    );

    const roomId = room.id;

    // ======================
    // 2. AMENITIES
    // ======================
    if (amenities.length) {
      const am = await Amenity.findAll({
        where: { id: amenities },
        transaction: t,
      });

      await room.setAmenities(am, { transaction: t });
    }

    // ======================
    // 3. OPTIONS
    // ======================


    if (options.length) {
      await RoomOption.bulkCreate(
        options.map((o) => ({
          name: o.name,
          price: Number(o.price),

          meal_plan: o.meal_plan || "none",
          cancellation_type: o.cancellation_type || "partial",
          free_cancel_days: o.free_cancel_days ?? 1,

          pay_later: o.pay_later ?? false,
          prepayment_required: o.prepayment_required ?? true,

          room_id: roomId,
        })),
        { transaction: t }
      );
    }


    // ======================
    // 4. EXTRAS
    // ======================
    if (extras.length) {
      await RoomExtra.bulkCreate(
        extras.map((e) => ({
          name: e.name,
          price: Number(e.price),
          type: e.type || "service",
          room_id: roomId,
        })),
        { transaction: t }
      );
    }

    // ======================
    // 5. PHOTOS
    // ======================
    if (req.files?.length) {
      await Photo.bulkCreate(
        req.files.map((file) => ({
          room_id: roomId,
          path: file.path,
        })),
        { transaction: t }
      );
    }

    await t.commit();

    // ======================
    // 6. RETURN FULL ROOM
    // ======================
    const fullRoom = await Room.findByPk(roomId, {
      include: [
        { model: Amenity, as: "amenities", through: { attributes: [] } },
        { model: RoomOption, as: "options" },
        { model: RoomExtra, as: "extras" },
        { model: Photo, as: "images" },
      ],
    });

    res.json({
      success: true,
      room: fullRoom,
    });
  } catch (e) {
    await t.rollback();

    console.error("CREATE ROOM ERROR:", e);

    res.status(500).json({
      message: "Create failed",
      error: e.message,
    });
  }
};

/* =========================================================
   UPDATE ROOM (PATCH STYLE)
========================================================= */


export const updateRoom = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;

    let {
      name,
      size,
      bed_type,
      max_guests,
      price,
      status,
      amenities = [],
      options = [],
      extras = [],
    } = req.body;

    // ======================
    // PARSE JSON (important)
    // ======================
    if (typeof amenities === "string") amenities = JSON.parse(amenities);
    if (typeof options === "string") options = JSON.parse(options);
    if (typeof extras === "string") extras = JSON.parse(extras);

    // ======================
    // FIND ROOM
    // ======================
    const room = await Room.findByPk(id);
    if (!room) {
      await t.rollback();
      return res.status(404).json({ message: "Room not found" });
    }

    // ======================
    // UPDATE ROOM BASIC
    // ======================
    await room.update(
      {
        name,
        size: size ? Number(size) : undefined,
        bed_type,
        max_guests: max_guests ? Number(max_guests) : undefined,
        price: price ? Number(price) : undefined,
        status,
      },
      { transaction: t }
    );

    // ======================
    // AMENITIES (M2M)
    // ======================
    if (Array.isArray(amenities)) {
      const am = await Amenity.findAll({
        where: { id: amenities },
        transaction: t,
      });

      await room.setAmenities(am, { transaction: t });
    }

    // ======================
    // OPTIONS (REPLACE)
    // ======================
    if (Array.isArray(options)) {
      await RoomOption.destroy({
        where: { room_id: id },
        transaction: t,
      });

      if (options.length) {
        await RoomOption.bulkCreate(
          options.map((o) => ({
            name: o.name, // 🔥 mandatory field FIX
            price: Number(o.price),

            meal_plan: o.meal_plan || "none",
            cancellation_type: o.cancellation_type || "free",
            free_cancel_days: o.free_cancel_days ?? 1,
            cancel_time: o.cancel_time || "23:59",

            pay_later: o.pay_later ?? false,
            prepayment_required: o.prepayment_required ?? true,

            room_id: id,
          })),
          { transaction: t }
        );
      }
    }

    // ======================
    // EXTRAS (REPLACE)
    // ======================
    if (Array.isArray(extras)) {
      await RoomExtra.destroy({
        where: { room_id: id },
        transaction: t,
      });

      if (extras.length) {
        await RoomExtra.bulkCreate(
          extras.map((e) => ({
            name: e.name, // 🔥 mandatory fix
            price: Number(e.price),
            type: e.type || "service",
            room_id: id,
          })),
          { transaction: t }
        );
      }
    }

    // ======================
    // COMMIT
    // ======================
    await t.commit();

    // ======================
    // RETURN UPDATED ROOM
    // ======================
    const updated = await Room.findByPk(id, {
      include: [
        { model: Amenity, as: "amenities", through: { attributes: [] } },
        { model: RoomOption, as: "options" },
        { model: RoomExtra, as: "extras" },
        { model: Photo, as: "images" },
      ],
    });

    return res.json({
      success: true,
      room: updated,
    });
  } catch (e) {
    await t.rollback();

    console.error("UPDATE ROOM ERROR:", e);

    return res.status(500).json({
      message: "Update failed",
      error: e.message,
    });
  }
};

/* =========================================================
   DELETE (SOFT DELETE)
========================================================= */
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findByPk(id);
    if (!room) return res.status(404).json({ message: "Not found" });

    await room.destroy(); // paranoid soft delete

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: "Delete failed" });
  }
};


export const restoreRoom = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findByPk(id, {
      paranoid: false, // 🔥 պարտադիր deleted record գտնելու համար
    });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    await room.restore();

    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Restore failed" });
  }
};

/* =========================================================
   BULK ARCHIVE
========================================================= */
export const bulkArchiveRooms = async (req, res) => {
  try {
    const { ids } = req.body;

    await Room.update(
      { status: "archived" },
      { where: { id: ids } }
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: "Bulk archive failed" });
  }
};

/* =========================================================
   GET ROOMS (USER + FILTER + GEO + PAGINATION)
========================================================= */



const isRoomAvailable = async (roomId, checkIn, checkOut) => {
  const conflict = await Booking.findOne({
    where: {
      room_id: roomId,
      status: "confirmed",
      [Op.or]: [
        {
          check_in: { [Op.lt]: checkOut },
          check_out: { [Op.gt]: checkIn },
        },
      ],
    },
  });

  return !conflict;
};

const calcRoomOptionPrice = (option, nights) => {
  const base = Number(option.price || 0);
  let price = base;

  // 1. static modifier (always applies)
  const modifier = Number(option.price_modifier || 0);
  price = price + (price * modifier) / 100;

  // 2. time-based discount
  const now = new Date();
  const start = option.discount_start ? new Date(option.discount_start) : null;
  const end = option.discount_end ? new Date(option.discount_end) : null;

  const isDiscountActive =
    start && end && now >= start && now <= end;

  if (isDiscountActive && option.discount_percent) {
    price = price - (price * option.discount_percent) / 100;
  }

  return {
    ...option,
    price_per_night: Number(price.toFixed(2)),
    total_price: Number((price * nights).toFixed(2)),
    discount_active: isDiscountActive,
  };
};

export const getRooms = async (req, res) => {

  try {
    const {
      hotel_id,
      minPrice,
      maxPrice,
      guests,
      bed_type,
      check_in,
      check_out,
      page = 1,
      limit = 10,
      sort,
    } = req.query;

    const limitInt = Math.max(parseInt(limit) || 10, 1);
    const pageInt = Math.max(parseInt(page) || 1, 1);
    const offset = (pageInt - 1) * limitInt;

    // ======================
    // NIGHTS
    // ======================
    const nights = check_in && check_out
      ? dayjs(check_out).diff(dayjs(check_in), "day")
      : 1;

    let order = [["id", "ASC"]];

    // ======================
    // ROOM FILTER
    // ======================
    const whereRoom = {
      status: "active",
      ...(hotel_id && { hotel_id: Number(hotel_id) }),
      ...(guests && { max_guests: { [Op.gte]: Number(guests) } }),
      ...(bed_type && { bed_type }),
    };

    // ======================
    // OPTION FILTER
    // ======================
    const whereOption = { status: "active" };

    if (minPrice) {
      whereOption.price = { ...whereOption.price, [Op.gte]: Number(minPrice) };
    }
    if (maxPrice) {
      whereOption.price = { ...whereOption.price, [Op.lte]: Number(maxPrice) };
    }

    // ======================
    // FETCH ROOMS
    // ======================
    const rooms = await Room.findAll({
      where: whereRoom,
      include: [
        {model: Hotels, as: "hotel" },
        {model: HotelPhotos,
          as: "images",
          attributes: ["id", "path"],
          required: false,
          separate: true,
          limit: 5,
          order: [["sort_order", "ASC"]]
        },
        { model: Amenity, as: "amenities", through: { attributes: [] } },
        {
          model: RoomOption,
          as: "options",
          required: Object.keys(whereOption).length > 1,
          where: Object.keys(whereOption).length ? whereOption : undefined,
        },


        { model: RoomExtra, as: "extras" },
      ],
      distinct: true,
      limit: limitInt,
      offset,
      order,
    });

    // ======================
    // FORMAT
    // ======================
    const formattedRooms = [];

    for (const room of rooms) {
      const r = room.toJSON();

      // ======================
      // AVAILABILITY
      // ======================
      let available = true;
      if (check_in && check_out) {
        available = await isRoomAvailable(r.id, check_in, check_out);
      }

      if (!available) {
        continue;
      }

      // ======================
      // OPTIONS
      // ======================
      const options = (r.options || []).map((opt) => {
        const priced = calcRoomOptionPrice(opt, nights);
        const freeCancellationUntil = check_in
          ? dayjs(check_in).subtract(opt.free_cancel_days, "day").format("YYYY-MM-DD")
          : null;

        return {
          ...priced,
          free_cancellation_until: freeCancellationUntil,
        };
      });

      // ======================
      // LOWEST PRICE
      // ======================
      const lowestPrice = options.length > 0
        ? Math.min(...options.map((o) => o.total_price))
        : 0;

      // ======================
      // GROUP AMENITIES
      // ======================
      const groupedAmenities = {};
      (r.amenities || []).forEach((a) => {
        const key = a.category || "Other";
        if (!groupedAmenities[key]) {
          groupedAmenities[key] = [];
        }
        groupedAmenities[key].push({ id: a.id, name: a.name, key: a.key });
      });

      // ======================
      // EXTRAS
      // ======================
      const extras = (r.extras || []).map((e) => ({
        id: e.id,
        name: e.name,
        type: e.type,
        price: e.price,
      }));

      // ======================
      // PUSH
      // ======================
      formattedRooms.push({
        id: r.id,
        hotel_id: r.hotel_id,
        name: r.name,
        size: r.size,
        bed_type: r.bed_type,
        max_guests: r.max_guests,
        lowest_price: lowestPrice,
        available,
        images: r.images || [],
        amenities: r.amenities || [],
        groupedAmenities,
        extras,
        options,
        hotel: r.hotel,
      });
    }

    // ======================
    // ======================
    if (sort === "price_asc") {
      formattedRooms.sort((a, b) => a.lowest_price - b.lowest_price);
    } else if (sort === "price_desc") {
      formattedRooms.sort((a, b) => b.lowest_price - a.lowest_price);
    }

    // ======================
    // RESPONSE
    // ======================
    return res.json({
      success: true,
      page: pageInt,
      limit: limitInt,
      total: formattedRooms.length,
      data: formattedRooms,
    });
  } catch (error) {
    console.log("GET ROOMS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Fetch failed",
    });
  }
};


export const getSimilarRooms = async (req, res, next) => {
  try {
    const { roomId, hotelId, property_class } = req.query;

    if (!roomId) {
      return res.status(400).json({
        status: "error",
        message: "roomId is required"
      });
    }


    const rooms = await Room.findAll({
      where: {
        id: { [Op.ne]: Number(roomId) },
        status: "active",
        deleted_at: null,
        ...(hotelId && { hotel_id: Number(hotelId) })
      },
      limit: 3,
      order: [["id", "DESC"]],

      subQuery: false,

      include: [
        {
          model: Hotels,
          as: "hotel",
          attributes: ["property_class", "rating"],
          required: property_class ? true : false,
          ...(property_class && {
            where: { property_class }
          })
        },
        {
          model: RoomOption,
          as: "options",
          where: { status: "active" },
          required: true,
          attributes: ["price"],
          separate: true
        },
        {
          model: HotelPhotos,
          as: "images",
          attributes: ["path", "room_id", "is_main"],
          where: { is_main: true },
          required: false,
          separate: true
        },
        {
          model: Amenity,
          as: "amenities",
          where: { key: ["1_bath", "2_bath", "3_bath"] },
          attributes: ["key", "name"],
          through: { attributes: [] },
          required: false
        }
      ]
    });

    if (!rooms || rooms.length === 0) {
      return res.status(200).json({ status: "success", data: [] });
    }

    // ========================================================
    // 🧹 CLEAN RESPONSE
    // ========================================================
    const cleanRooms = rooms.map((room) => {
      const plain = room.toJSON();
      const hotelData = plain.hotel || {};
      const roomOptions = plain.options || [];
      const roomPhotos = plain.images || [];
      const roomAmenities = plain.amenities || [];

      // 1. Գլխավոր նկարի հայտնաբերում
      const mainImage = roomPhotos.length > 0 ? roomPhotos[0].path : "default-room.jpg";

      // 2. Ամենաէժան գնի հաշվարկ
      const pricesArray = roomOptions.map(opt => opt.price);
      const lowestPrice = pricesArray.length > 0 ? Math.min(...pricesArray) : 0;

      const foundBathroom = roomAmenities[0];
      const bathsCount = foundBathroom ? foundBathroom.name : "1 Bath";

      return {
        id: plain.id,
        name: plain.name,
        image: mainImage,
        property_class: plain.roomType || "Standard Room",
        price: lowestPrice,
        rating: hotelData.rating ? Number(hotelData.rating.toFixed(1)) : 5.0,
        beds: plain.bed_type || "1 King Bed",
        baths: bathsCount,
        size: plain.size ? `${plain.size} sqft` : "400 sqft"
      };
    });

    return res.status(200).json({
      status: "success",
      data: cleanRooms
    });

  } catch (error) {
    next(error);
  }
};


export const getRoomById = async (req, res) => {
  try {
    const { check_in, check_out } = req.query;

    // ==========================================
    // ⏳ NIGHTS
    // ==========================================
    const nights =
      check_in && check_out
        ? dayjs(check_out).diff(dayjs(check_in), "day")
        : 1;

    // ==========================================
    // 🛏️ ROOM FETCH
    // ==========================================
    const room = await Room.findByPk(req.params.id, {
      include: [
        { model: Hotels, as: "hotel" },
        {
          model: Amenity,
          as: "amenities",
          through: { attributes: [] },
        },
        {
          model: RoomOption,
          as: "options",
          required: false,
        },
        { model: RoomExtra, as: "extras" },
        {  model: HotelPhotos,
          as: "images",
          attributes: ["id", "path", "category", "is_main"],
          required: false,
          order: [["sort_order", "ASC"]] },
      ],
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const r = room.toJSON();

    // ==========================================
    // 📅 AVAILABILITY
    // ==========================================
    const available =
      check_in && check_out
        ? await isRoomAvailable(r.id, check_in, check_out)
        : true;

    // 💳 OPTIONS (SINGLE SOURCE OF TRUTH)
    // ==========================================
    const options = (r.options || []).map((opt) => {
      const priced = calcRoomOptionPrice(opt, nights);

      const now = dayjs();
      const hasModifier = Number(opt.priceModifier || opt.price_modifier || 0) < 0;

      const discountStart = opt.discountStart || opt.discount_start;
      const discountEnd = opt.discountEnd || opt.discount_end;

      const isDiscountDateValid =
        discountStart && discountEnd
          ? now.isAfter(dayjs(discountStart)) && now.isBefore(dayjs(discountEnd))
          : true;

      // Վերջնական ակտիվ դրոշակը
      const hasActiveDiscount = hasModifier && isDiscountDateValid;

      const basePricePerNight = Number(opt.price || 0);
      const baseTotalPrice = basePricePerNight * nights;

      // 💡 ՈՒՂՂՎԱԾ Է. Վերցնում ենք ձեր ֆունկցիայի հաշվարկած ճիշտ տոկոսային գինը (96)
      const pricedPricePerNight = priced.pricePerNight || priced.price_per_night || basePricePerNight;
      const pricedTotalPrice = priced.totalPrice || priced.total_price || baseTotalPrice;

      // Եթե զեղչը ակտիվ է, օգտագործում ենք 96-ը, հակառակ դեպքում՝ 120-ը
      const finalPricePerNight = hasActiveDiscount ? pricedPricePerNight : basePricePerNight;
      const finalTotalPrice = hasActiveDiscount ? pricedTotalPrice : baseTotalPrice;

      return {
        id: opt.id,
        roomId: opt.roomId || opt.room_id,
        name: opt.name,
        mealPlan: opt.mealPlan || opt.meal_plan,

        // Հին օրիգինալ գները (React-ում վրան գծիկ քաշելու համար)
        originalPricePerNight: basePricePerNight,
        originalTotalPrice: baseTotalPrice,

        priceModifier: Number(opt.priceModifier || opt.price_modifier || 0),
        discountStart: discountStart,
        discountEnd: discountEnd,

        cancellationType: opt.cancellationType || opt.cancellation_type,
        freeCancelDays: opt.freeCancelDays || opt.free_cancel_days,
        cancelTime: opt.cancelTime || opt.cancel_time || "23:59",

        // Վերջնական ճիշտ գները React-ի համար
        pricePerNight: finalPricePerNight,
        totalPrice: finalTotalPrice,

        hasActiveDiscount: hasActiveDiscount,
      };
    });

    // ==========================================
    // 💰 LOWEST PRICE
    // ==========================================
    const lowestPrice =
      options.length > 0
        ? Math.min(...options.map((o) => o.total_price))
        : 0;

    // ==========================================
    // 🛠️ AMENITIES GROUPING
    // ==========================================
    const groupedAmenities = (r.amenities || []).reduce((acc, a) => {
      const key = a.category || "Other";

      if (!acc[key]) acc[key] = [];

      acc[key].push({
        id: a.id,
        name: a.name,
        key: a.key,
      });

      return acc;
    }, {});

    // ==========================================
    // 📦 EXTRAS
    // ==========================================
    const extras = (r.extras || []).map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      price: Number(e.price || 0),
    }));

    // ==========================================
    // 🚀 RESPONSE
    // ==========================================
    return res.json({
      success: true,
      data: {
        id: r.id,
        hotel_id: r.hotel_id,
        name: r.name,

        room_type: r.roomType || "Standard Room",
        size: r.size,
        bed_type: r.bed_type,
        max_guests: r.max_guests,

        available,

        lowest_price: lowestPrice,

        images: r.images || [],
        amenities: r.amenities || [],
        groupedAmenities,

        extras,
        options,

        hotel: r.hotel,
      },
    });
  } catch (err) {
    console.error("GET ROOM BY ID ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const getRoomGallery = async (req, res) => {
  try {
    const { room_id } = req.query;

    if (!room_id) {
      return res.status(400).json({ success: false, message: "room_id is required" });
    }

    const photos = await HotelPhotos.findAll({
      where: { room_id },
      order: [["sort_order", "ASC"]],
    });

    return res.status(200).json({ success: true, data: photos });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};







/* =========================================================
   UPLOAD IMAGES (CLOUDINARY READY)
========================================================= */


export const uploadRoomImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category } = req.body;
    const authUserId = req.userId;
    const authUserRole = req.user?.role;


    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    // 1. Գտնում ենք սենյակը
    const room = await Room.findByPk(id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    const hotel = await Hotels.findByPk(room.hotel_id);
    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }

    // 3. Իրավունքների ստուգում
    const isHotelOwner = hotel.user_id === authUserId;
    const isSuperAdmin = authUserRole === "superadmin";

    if (!isHotelOwner && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not the admin of this hotel."
      });
    }

    const images = req.files.map((file) => ({
      room_id: Number(id),
      hotel_id: room.hotel_id,
      path: file.path,
      public_id: file.filename || null,
      category: category || "Bedrooms",
      uploaded_by: authUserId || null
    }));

    await HotelPhotos.bulkCreate(images);

    return res.json({ success: true, images });
  } catch (e) {
    next(e)
  }
};

//sa verjinn er
// export const uploadRoomImages = async (req, res) => {
//   try {
//     const { id } = req.params;
//
//     const images = req.files.map((file) => ({
//       room_id: id,
//       path: file.path,
//     }));
//
//     await Photo.bulkCreate(images);
//
//     res.json({ success: true, images });
//   } catch (e) {
//     res.status(500).json({ message: "Upload failed" });
//   }
// };

/* =========================================================
   ADMIN DASHBOARD STATS
========================================================= */
export const getRoomDashboardStats = async (req, res) => {
  try {
    const [statusRows, total, deleted] = await Promise.all([
      Room.findAll({
        attributes: [
          "status",
          [fn("COUNT", col("id")), "count"],
        ],
        group: ["status"],
        paranoid: false,
      }),

      Room.count({ paranoid: false }),

      Room.count({
        where: {
          deleted_at: { [Op.not]: null },
        },
        paranoid: false,
      }),
    ]);

    const stats = {
      active: 0,
      draft: 0,
      archived: 0,
      deleted,
      total,
    };

    statusRows.forEach((r) => {
      stats[r.status] = Number(r.dataValues.count);
    });

    const chart = [
      { label: "Active", value: stats.active },
      { label: "Draft", value: stats.draft },
      { label: "Archived", value: stats.archived },
      { label: "Deleted", value: stats.deleted },
    ];

    res.json({
      success: true,
      stats,
      chart,
    });
  } catch (e) {
    res.status(500).json({ message: "Stats failed" });
  }
};





// geo avelacnel hotelin
// export const getRooms = async (req, res) => {
//   try {
//     const {
//       minPrice,
//       maxPrice,
//       guests,
//       lat,
//       lon,
//       radius = 5,
//       page = 1,
//       limit = 10,
//       sort,
//     } = req.query;
//
//     const offset = (page - 1) * limit;
//
//     const distanceLiteral =
//       lat && lon
//         ? `(6371 * acos(
//           cos(radians(${lat})) *
//           cos(radians(Hotels.lat)) *
//           cos(radians(Hotels.lon) - radians(${lon})) +
//           sin(radians(${lat})) *
//           sin(radians(Hotels.lat))
//         ))`
//         : null;
//
//     let order = [];
//
//     if (sort === "price_asc") {
//       order = [[fn("MIN", col("RoomOptions.price")), "ASC"]];
//     }
//
//     if (sort === "price_desc") {
//       order = [[fn("MIN", col("RoomOptions.price")), "DESC"]];
//     }
//
//     const rooms = await Room.findAll({
//       attributes: {
//         include: [
//           [fn("MIN", col("RoomOptions.price")), "min_price"],
//           ...(distanceLiteral
//             ? [[sequelize.literal(distanceLiteral), "distance"]]
//             : []),
//         ],
//       },
//
//       where: {
//         ...(guests && { max_guests: { [Op.gte]: guests } }),
//       },
//
//       include: [
//         {
//           model: RoomOption,
//           attributes: [],
//           where: {
//             ...(minPrice && { price: { [Op.gte]: minPrice } }),
//             ...(maxPrice && { price: { [Op.lte]: maxPrice } }),
//           },
//         },
//         {
//           model: Hotels,
//           required: true,
//           ...(distanceLiteral && {
//             where: sequelize.literal(`${distanceLiteral} <= ${radius}`),
//           }),
//         },
//         {
//           model: Photo,
//           as: "images",
//         },
//       ],
//
//       group: ["Room.id"],
//       order,
//       limit: parseInt(limit),
//       offset: parseInt(offset),
//     });
//
//     res.json(rooms);
//   } catch (e) {
//     res.status(500).json({ message: "Fetch failed" });
//   }
// };
