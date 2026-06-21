import path from 'path';
import fs from 'fs';
import dayjs from "dayjs";

export default class FileHelper {

  static getFilePath(file) {
    if (!file) return null;
    return path.normalize(file.path).replace(/\\/g, '/');
  }

  static deleteFile(filePath) {
    if (!filePath) return;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }


  static getHotelStars(hotel) {
    const baseStarsMap = {
      hotel: 3,
      resort: 4,
      villa: 4,
      apartment: 2,
      hostel: 1,
    };

    let stars = baseStarsMap[hotel.property_class] || 2;
    const amenities = hotel.Amenities || [];
    const keys = amenities.map((a) => a.key);

    const important = ["pool", "restaurant", "spa", "gym"];

    const importantCount = important.filter((k) =>
      keys.includes(k)
    ).length;

    if (importantCount >= 2) stars += 1;
    else if (importantCount === 1) stars += 0.5;

    if (amenities.length >= 15) stars += 1;
    else if (amenities.length >= 8) stars += 0.5;

    if (hotel.rating >= 9) stars += 0.5;
    else if (hotel.rating >= 8) stars += 0.3;

    // ⭐ HALF STAR
    stars = Math.round(stars * 2) / 2;

    if (stars > 5) stars = 5;
    if (stars < 1) stars = 1;

    return stars;
  };





  static calculateRefund (option, checkInDate, cancelDate) {
    const checkIn = dayjs(checkInDate);
    const cancel = dayjs(cancelDate);

    const diffDays = checkIn.diff(cancel, "day");

    if (diffDays >= option.free_cancel_days) {
      return { type: "full", refundPercent: 100 };
    }

    if (option.cancellation_type === "partial") {
      return { type: "partial", refundPercent: 50 };
    }

    return { type: "none", refundPercent: 0 };
  };



  // static calculateBookingPrice(
  //   ratePlan,
  //   check_in,
  //   check_out,
  //   guests = 1
  // ) {
  //
  //   // =========================
  //   // NIGHTS
  //   // =========================
  //   const nights =
  //     dayjs(check_out).diff(
  //       dayjs(check_in),
  //       "day"
  //     );
  //
  //   if (nights <= 0) {
  //     throw new Error(
  //       "Invalid booking dates"
  //     );
  //   }
  //
  //   // =========================
  //   // BASE PRICE
  //   // =========================
  //   let nightlyPrice =
  //     Number(ratePlan.price);
  //
  //   // =========================
  //   // SEASON MODIFIER
  //   // =========================
  //   if (
  //     ratePlan.season_start &&
  //     ratePlan.season_end
  //   ) {
  //
  //     const today =
  //       dayjs(check_in);
  //
  //     const inSeason =
  //       today.isAfter(
  //         dayjs(ratePlan.season_start)
  //           .subtract(1, "day")
  //       ) &&
  //       today.isBefore(
  //         dayjs(ratePlan.season_end)
  //           .add(1, "day")
  //       );
  //
  //     if (inSeason) {
  //
  //       nightlyPrice +=
  //         Number(
  //           ratePlan.price_modifier || 0
  //         );
  //     }
  //   }
  //
  //   // =========================
  //   // EXTRA GUEST CHARGE
  //   // example:
  //   // first 2 guests free
  //   // =========================
  //   let extraGuestFee = 0;
  //
  //   if (guests > 2) {
  //
  //     extraGuestFee = (guests - 2) * 20 * nights;
  //   }
  //
  //   // =========================
  //   // SUBTOTAL
  //   // =========================
  //   const subtotal = nightlyPrice * nights;
  //
  //   // =========================
  //   // TOTAL
  //   // =========================
  //   const total = subtotal + extraGuestFee;
  //
  //   // =========================
  //   // RETURN
  //   // =========================
  //   return {
  //
  //     nights,
  //
  //     nightly_price: nightlyPrice,
  //     subtotal,
  //     extra_guest_fee: extraGuestFee,
  //     total,
  //   };
  // };
  static calculateBookingPrice(
    ratePlan,
    check_in,
    check_out,
    guests = 1
  ) {

    // =========================
    // NIGHTS
    // =========================
    const nights = dayjs(check_out).diff(dayjs(check_in), "day");

    if (nights <= 0) {
      throw new Error("Invalid booking dates");
    }

    // =========================
    // BASE PRICE
    // =========================
    const basePrice = Number(ratePlan.price); // Ձեր դեպքում՝ 120
    let nightlyPrice = basePrice;

    // =========================
    // SEASON / RATE PLAN MODIFIER
    // =========================
    const modifierPercent = Number(ratePlan.price_modifier || 0); // Ձեր դեպքում՝ -15

    if (modifierPercent !== 0) {
      // 💡 1. Եթե սեզոնի ամսաթվերը լրացված են, ստուգում ենք սեզոնի մեջ լինելը
      if (ratePlan.season_start && ratePlan.season_end) {
        const today = dayjs(check_in);
        const inSeason =
          today.isAfter(dayjs(ratePlan.season_start).subtract(1, "day")) &&
          today.isBefore(dayjs(ratePlan.season_end).add(1, "day"));

        if (inSeason) {
          const modifierAmount = (basePrice * modifierPercent) / 100;
          nightlyPrice += modifierAmount;
        }
      } else {
        // 💡 2. Եթե սեզոնի ամսաթվերը null են, նշանակում է զեղչը գործում է ՄԻՇՏ
        const modifierAmount = (basePrice * modifierPercent) / 100; // (120 * -15) / 100 = -18
        nightlyPrice += modifierAmount; // 120 + (-18) = 102
      }
    }

    // =========================
    // EXTRA GUEST CHARGE
    // =========================
    let extraGuestFee = 0;
    if (guests > 2) {
      extraGuestFee = (guests - 2) * 20 * nights;
    }

    // =========================
    // SUBTOTAL
    // =========================
    const subtotal = nightlyPrice * nights;

    // =========================
    // TOTAL
    // =========================
    const total = subtotal + extraGuestFee;

    // =========================
    // RETURN
    // =========================
    return {
      nights,
      nightly_price: nightlyPrice,
      subtotal,
      extra_guest_fee: extraGuestFee,
      total,
    };
  }


}




