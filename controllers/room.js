import sequelize from "../clients/db.sequelize.mysql.js";
import { Op, fn, col, literal, Sequelize  } from "sequelize";

import Room from "../models/Room.js";
import Amenity from "../models/Amenity.js";
import RoomOption from "../models/RoomOption.js";
import RoomExtra from "../models/RoomExtra.js";
import Photo from "../models/Photo.js";
import Hotels from "../models/Hotels.js";
import {cloudinary} from "../middlewares/upload.js";
import Booking from "../models/Booking.js";
import dayjs from "dayjs";



/* =========================================================
   CREATE ROOM
========================================================= */


// export const createRoom = async (req, res) => {
//   const t = await sequelize.transaction();
//
//   console.log(req.body.extras, req.body.options, 888888)
//   try {
//     let {
//       hotel_id,
//       name,
//       size,
//       bed_type,
//       max_guests,
//       price,
//       status = "active",
//       amenities = [],
//       options = [],
//       extras = [],
//     } = req.body;
//
//     // 🔥 Parse FormData JSON
//     if (typeof amenities === "string") amenities = JSON.parse(amenities);
//     if (typeof options === "string") options = JSON.parse(options);
//     if (typeof extras === "string") extras = JSON.parse(extras);
//
//     // 1. ROOM CREATE
//     const room = await Room.create(
//       {
//         hotel_id: Number(hotel_id),
//         name,
//         size: Number(size),
//         bed_type,
//         max_guests: Number(max_guests),
//         price: Number(price),
//         status,
//       },
//       { transaction: t }
//     );
//
//     // Վերցնում ենք ստեղծված ID-ն
//     const roomId = room.id;
//     console.log(roomId,123)
//     // 2. AMENITIES (Փոխված է id-ով փնտրելու համար)
//     if (amenities && amenities.length) {
//       const am = await Amenity.findAll({
//         where: { id: amenities }, // Օգտագործում ենք id, ոչ թե key
//         transaction: t,
//       });
//       await room.setAmenities(am, { transaction: t });
//     }
//
//     // 3. OPTIONS (Հստակ roomId-ով)
//     if (options && options.length) {
//       await RoomOption.bulkCreate(
//         options.map((o) => ({
//           ...o,
//           price: Number(o.price),
//           room_id: roomId,
//         })),
//         { transaction: t }
//       );
//     }
//
//     // 4. EXTRAS (Հստակ roomId-ով)
//     if (extras && extras.length) {
//       await RoomExtra.bulkCreate(
//         extras.map((e) => ({
//           ...e,
//           price: Number(e.price),
//           room_id: roomId,
//         })),
//         { transaction: t }
//       );
//     }
//
//     // 5. PHOTOS (Հստակ roomId-ով)
//     if (req.files?.length) {
//       await Photo.bulkCreate(
//         req.files.map((file) => ({
//           room_id: roomId,
//           path: file.path,
//         })),
//         { transaction: t }
//       );
//     }
//
//     await t.commit();
//
//     // 6. RETURN FULL ROOM
//     const fullRoom = await Room.findByPk(roomId, {
//       include: [
//         { model: Amenity, as: "amenities", through: { attributes: [] } },
//         { model: RoomOption, as: "options" },
//         { model: RoomExtra, as: "extras" },
//         { model: Photo, as: "images" },
//       ],
//     });
//
//     res.json({
//       success: true,
//       room: fullRoom,
//     });
//   } catch (e) {
//     if (t) await t.rollback();
//     console.error("CREATE ROOM ERROR:", e);
//     res.status(500).json({
//       message: "Create failed",
//       error: e.message,
//     });
//   }
// };
//



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


// export const updateRoom = async (req, res) => {
//   const t = await sequelize.transaction();
//
//   try {
//     const { id } = req.params;
//
//     const {
//       name,
//       size,
//       bed_type,
//       max_guests,
//       price,
//       status,
//       amenities,
//       options,
//       extras,
//     } = req.body;
//
//     const room = await Room.findByPk(id);
//     if (!room) {
//       await t.rollback();
//       return res.status(404).json({ message: "Not found" });
//     }
//
//     await room.update(
//       {
//         ...(name && { name }),
//         ...(size && { size }),
//         ...(bed_type && { bed_type }),
//         ...(max_guests && { max_guests }),
//         ...(price && { price }),
//         ...(status && { status }),
//       },
//       { transaction: t }
//     );
//
//     if (amenities) {
//       const am = await Amenity.findAll({
//         where: { id: amenities },
//         transaction: t,
//       });
//
//       await room.setAmenities(am, { transaction: t });
//     }
//
//     if (options) {
//       await RoomOption.destroy({ where: { room_id: id }, transaction: t });
//
//       if (options.length) {
//         await RoomOption.bulkCreate(
//           options.map((o) => ({ ...o, room_id: id })),
//           { transaction: t }
//         );
//       }
//     }
//
//     if (extras) {
//       await RoomExtra.destroy({ where: { room_id: id }, transaction: t });
//
//       if (extras.length) {
//         await RoomExtra.bulkCreate(
//           extras.map((e) => ({ ...e, room_id: id })),
//           { transaction: t }
//         );
//       }
//     }
//
//     await t.commit();
//
//     const updated = await Room.findByPk(id, {
//       include: [
//         { model: Amenity, through: { attributes: [] } },
//         { model: RoomOption },
//         { model: RoomExtra },
//         { model: Photo, as: "images" },
//       ],
//     });
//
//     res.json({ success: true, room: updated });
//   } catch (e) {
//     await t.rollback();
//     res.status(500).json({ message: "Update failed" });
//   }
// };

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

/* =========================================================
   RESTORE ROOM
========================================================= */
// export const restoreRoom = async (req, res) => {
//   try {
//     const { id } = req.params;
//
//     await Room.restore({ where: { id } });
//
//     res.json({ success: true });
//   } catch (e) {
//     res.status(500).json({ message: "Restore failed" });
//   }
// };


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

  return {
    ...option,
    price_per_night: base,
    total_price: Number((base * nights).toFixed(2)),
  };
};




export const getRooms = async (req, res) => {
  console.log(req.check_in,555)


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

    const limitInt =
      Math.max(
        parseInt(limit) || 10,
        1
      );

    const pageInt =
      Math.max(
        parseInt(page) || 1,
        1
      );

    const offset =
      (pageInt - 1) * limitInt;

    // ======================
    // NIGHTS
    // ======================

    const nights =
      check_in && check_out
        ? dayjs(check_out).diff(
          dayjs(check_in),
          "day"
        )
        : 1;

    // ======================
    // SORT
    // ======================

    let order = [];

    if (sort === "price_asc") {
      order.push(["id", "ASC"]);
    }

    if (sort === "price_desc") {
      order.push(["id", "DESC"]);
    }

    // ======================
    // ROOM FILTER
    // ======================

    const whereRoom = {
      status: "active",

      ...(hotel_id && {
        hotel_id: Number(hotel_id),
      }),

      ...(guests && {
        max_guests: {
          [Op.gte]:
            Number(guests),
        },
      }),

      ...(bed_type && {
        bed_type,
      }),
    };

    // ======================
    // OPTION FILTER
    // ======================

    const whereOption = {
      status: "active",
    };

    if (minPrice) {
      whereOption.price = {
        ...whereOption.price,

        [Op.gte]:
          Number(minPrice),
      };
    }

    if (maxPrice) {
      whereOption.price = {
        ...whereOption.price,

        [Op.lte]:
          Number(maxPrice),
      };
    }

    // ======================
    // FETCH ROOMS
    // ======================

    const rooms = await Room.findAll({
      where: whereRoom,

      include: [
        {
          model: Hotels,
          as: "hotel",
        },

        {
          model: Photo,
          as: "images",
          attributes: ["id", "path"],

        },

        {
          model: Amenity,
          as: "amenities",
          through: {
            attributes: [],
          },
        },

        {
          model: RoomOption,
          as: "options",

          required: false,

          where:
            Object.keys(
              whereOption
            ).length
              ? whereOption
              : undefined,
        },

        {
          model: RoomExtra,
          as: "extras",
        },
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

      if (
        check_in &&
        check_out
      ) {
        available =
          await isRoomAvailable(
            r.id,
            check_in,
            check_out
          );
      }

      if (!available) {
        continue;
      }

      // ======================
      // OPTIONS
      // ======================

      // const options = (
      //   r.options || []
      // ).map((opt) =>
      //   calcRoomOptionPrice(
      //     opt,
      //     nights
      //   )
      // );

      const options = (
        r.options || []
      ).map((opt) => {

        const priced =
          calcRoomOptionPrice(
            opt,
            nights
          );

        const freeCancellationUntil =
          check_in
            ? dayjs(check_in)
              .subtract(
                opt.free_cancel_days,
                "day"
              )
              .format(
                "YYYY-MM-DD"
              )
            : null;

        return {
          ...priced,

          free_cancellation_until:
          freeCancellationUntil,
        };
      });

      // ======================
      // LOWEST PRICE
      // ======================

      const lowestPrice =
        options.length > 0
          ? Math.min(
            ...options.map(
              (o) =>
                o.total_price
            )
          )
          : 0;

      // ======================
      // GROUP AMENITIES
      // ======================

      const groupedAmenities =
        {};

      (
        r.amenities || []
      ).forEach((a) => {
        const key =
          a.category ||
          "Other";

        if (
          !groupedAmenities[key]
        ) {
          groupedAmenities[
            key
            ] = [];
        }

        groupedAmenities[
          key
          ].push({
          id: a.id,

          name: a.name,

          key: a.key,
        });
      });

      // ======================
      // EXTRAS
      // ======================

      const extras = (
        r.extras || []
      ).map((e) => ({
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

        hotel_id:
        r.hotel_id,

        name: r.name,

        size: r.size,

        bed_type:
        r.bed_type,

        max_guests:
        r.max_guests,

        lowest_price:
        lowestPrice,

        available,

        images:
          r.images || [],

        amenities:
          r.amenities || [],

        groupedAmenities,

        extras,

        options,

        hotel: r.hotel,
      });
    }

    // ======================
    // RESPONSE
    // ======================

    return res.json({
      success: true,

      page: pageInt,

      limit: limitInt,

      total:
      formattedRooms.length,

      data: formattedRooms,
    });
  } catch (error) {
    console.log(
      "GET ROOMS ERROR:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,

        message:
          "Fetch failed",
      });
  }
};


// export const getRooms = async (req, res) => {
//   try {
//     const {
//       minPrice,
//       maxPrice,
//       guests,
//       bed_type,
//       check_in,
//       check_out,
//       page = 1,
//       limit = 10,
//       sort,
//     } = req.query;
//
//     const limitInt = Math.max(parseInt(limit) || 10, 1);
//     const pageInt = Math.max(parseInt(page) || 1, 1);
//     const offset = (pageInt - 1) * limitInt;
//
//     // ======================
//     // SORT
//     // ======================
//     let order = [];
//     if (sort === "price_asc") order.push(["price", "ASC"]);
//     if (sort === "price_desc") order.push(["price", "DESC"]);
//
//     // ======================
//     // ROOM FILTER
//     // ======================
//     const whereRoom = {
//       ...(guests && { max_guests: { [Op.gte]: Number(guests) } }),
//       ...(bed_type && { bed_type }),
//     };
//
//     // ======================
//     // OPTION FILTER
//     // ======================
//     const whereOption = {};
//     if (minPrice) whereOption.price = { ...whereOption.price, [Op.gte]: Number(minPrice) };
//     if (maxPrice) whereOption.price = { ...whereOption.price, [Op.lte]: Number(maxPrice) };
//
//     // ======================
//     // AVAILABILITY (FIXED)
//     // ======================
//     const availabilityWhere =
//       check_in && check_out
//         ? {
//           [Op.or]: [
//             {
//               check_in: { [Op.lt]: check_out },
//               check_out: { [Op.gt]: check_in },
//             },
//           ],
//         }
//         : null;
//
//     const rooms = await Room.findAll({
//       where: whereRoom,
//
//       include: [
//         { model: Hotels, as: "hotel" },
//         { model: Photo, as: "images" },
//         { model: Amenity, as: "amenities", through: { attributes: [] } },
//
//         {
//           model: RoomOption,
//           as: "options",
//           required: false,
//           where: Object.keys(whereOption).length ? whereOption : undefined,
//         },
//
//         { model: RoomExtra, as: "extras" },
//
//         ...(availabilityWhere
//           ? [
//             {
//               model: Booking,
//               required: false,
//               attributes: [],
//               where: availabilityWhere,
//             },
//           ]
//           : []),
//       ],
//
//       // 🔥 EXCLUDE booked rooms
//       having:
//         check_in && check_out
//           ? sequelize.literal(`COUNT(bookings.id) = 0`)
//           : undefined,
//
//       group: ["Room.id"],
//
//       distinct: true,
//       order,
//
//       limit: limitInt,
//       offset,
//     });
//
//     return res.json({
//       success: true,
//       page: pageInt,
//       limit: limitInt,
//       data: rooms,
//     });
//   } catch (error) {
//     console.log("GET ROOMS ERROR:", error);
//     return res.status(500).json({ message: "Fetch failed" });
//   }
// };





///singleRoom


export const getRoomById = async (req, res) => {
  try {
    const {
      check_in,
      check_out,
    } = req.query;

    // ======================
    // NIGHTS
    // ======================

    const nights =
      check_in && check_out
        ? dayjs(check_out).diff(
          dayjs(check_in),
          "day"
        )
        : 1;

    // ======================
    // ROOM
    // ======================

    const room = await Room.findByPk(
      req.params.id,
      {
        include: [
          {
            model: Hotels,
            as: "hotel",
          },

          {
            model: Amenity,
            as: "amenities",
            through: {
              attributes: [],
            },
          },

          {
            model: RoomOption,
            as: "options",
            where: {
              status: "active",
            },
            required: false,
          },

          {
            model: RoomExtra,
            as: "extras",
          },

          {
            model: Photo,
            as: "images",
            attributes: ["id", "path"],
          }
          // {
          //   model: Photo,
          //   as: "images",
          // },
        ],
      }
    );

    // ======================
    // NOT FOUND
    // ======================

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const r = room.toJSON();

    // ======================
    // AVAILABILITY
    // ======================

    let available = true;

    if (check_in && check_out) {
      available =
        await isRoomAvailable(
          r.id,
          check_in,
          check_out
        );
    }

    // ======================
    // OPTIONS
    // ======================

    const options = (
      r.options || []
    ).map((opt) => {
      const priced =
        calcRoomOptionPrice(
          opt,
          nights
        );

      const freeCancellationUntil =
        check_in
          ? dayjs(check_in)
            .subtract(
              opt.free_cancel_days,
              "day"
            )
            .format(
              "YYYY-MM-DD"
            )
          : null;

      return {
        ...priced,

        free_cancellation_until:
        freeCancellationUntil,
      };
    });

    // ======================
    // LOWEST PRICE
    // ======================

    const lowestPrice =
      options.length > 0
        ? Math.min(
          ...options.map(
            (o) => o.total_price
          )
        )
        : 0;

    // ======================
    // GROUP AMENITIES
    // ======================

    const groupedAmenities = {};

    (r.amenities || []).forEach(
      (a) => {
        const key =
          a.category || "Other";

        if (
          !groupedAmenities[key]
        ) {
          groupedAmenities[key] =
            [];
        }

        groupedAmenities[key].push({
          id: a.id,
          name: a.name,
          key: a.key,
        });
      }
    );

    // ======================
    // EXTRAS
    // ======================

    const extras = (
      r.extras || []
    ).map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      price: e.price,
    }));

    // ======================
    // RESPONSE
    // ======================

    return res.json({
      success: true,

      data: {
        id: r.id,

        hotel_id: r.hotel_id,

        name: r.name,

        size: r.size,

        bed_type: r.bed_type,

        max_guests:
        r.max_guests,

        available,

        lowest_price:
        lowestPrice,

        images:
          r.images || [],

        amenities:
          r.amenities || [],

        groupedAmenities,

        extras,

        options,

        hotel: r.hotel,
      },
    });
  } catch (err) {
    console.error(
      "GET ROOM BY ID ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// export const getRoomById = async (req, res) => {
//   console.log(888)
//   try {
//     const room = await Room.findByPk(req.params.id, {
//       include: [
//         {
//           model: Amenity,
//           as: "amenities",
//           through: { attributes: [] },
//         },
//         {
//           model: RoomOption,
//           as: "options",
//         },
//         {
//           model: RoomExtra,
//           as: "extras",
//         },
//         {
//           model: Photo,
//           as: "images",
//         },
//
//         // {
//         //   model: Photo,
//         //   as: "images",
//         //   attributes: ["path"]
//         // },
//       ],
//     });
//
//     if (!room) {
//       return res.status(404).json({
//         message: "Room not found",
//       });
//     }
//
//     res.json(room);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: "Server error",
//     });
//   }
// };




/* =========================================================
   UPLOAD IMAGES (CLOUDINARY READY)
========================================================= */
export const uploadRoomImages = async (req, res) => {
  try {
    const { id } = req.params;

    const images = req.files.map((file) => ({
      room_id: id,
      path: file.path,
    }));

    await Photo.bulkCreate(images);

    res.json({ success: true, images });
  } catch (e) {
    res.status(500).json({ message: "Upload failed" });
  }
};

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
