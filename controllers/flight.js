import axios from "axios";



const RAPIDAPI_KEY =
    '900ae502e3msh29f8b5acc36365bp12d76fjsnfe74e29edbc6'
  // "08daf8401amsha133c8f117f5883p1f2bafjsnd4c886293eca"
;

function formatItinerariesResponse(apiResponse, page = 1, limit = 10) {
  const itineraries = apiResponse.itineraries || [];
  const metadata = apiResponse.metadata || [];
  const start = (page - 1) * limit;
  const paginated = itineraries.slice(start, start + limit);

  const topResultsRaw = metadata?.topResults || {};

  const results = paginated.map(itinerary => {
    const outboundSegment = itinerary.outbound?.sectorSegments?.[0]?.segment;
    const inboundSegment = itinerary.inbound?.sectorSegments?.[0]?.segment;

    const durationMinutes = itinerary.duration
      ? Math.ceil(itinerary.duration / 60)
      : null;
    const readableDuration = durationMinutes
      ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}min`
      : null;

    // Format topResults for this itinerary
    const topResults = {};
    for (const key in topResultsRaw) {
      const top = topResultsRaw[key];
      if (top) {
        topResults[key] = {
          id: top.id,
          price: parseFloat(top.price?.amount || top.price || 0),
          durationMinutes: top.durationMinutes || top.duration
        };
      }
    }

    return {
      id: itinerary.id,
      shareId: itinerary.shareId || null,
      price: parseFloat(itinerary.price?.amount || 0),
      from: outboundSegment?.source?.station?.city?.name || '',
      to: outboundSegment?.destination?.station?.city?.name || '',
      airline: outboundSegment?.carrier?.name || '',
      cabinClass: outboundSegment?.cabinClass || '',
      durationMinutes,
      readableDuration,
      bookingUrl: itinerary.bookingOptions?.edges?.[0]?.node?.bookingUrl || '',
      bagsInfo: itinerary.bagsInfo || {},
      outboundDate: outboundSegment?.source?.localTime || '',
      inboundDate: inboundSegment?.source?.localTime || '',
      stopover: itinerary.stopover || {},
      lastAvailable: itinerary.lastAvailable || {},
      provider: itinerary.provider || {},
      topResults,
    };
  });

  return {
    page,
    limit: metadata.itinerariesCount,
    hasNextPage: start + limit < itineraries.length,
    hasPrevPage: page > 1,
    results,
    metadata: {
      carriers: metadata.carriers || [],
      topResults: metadata.topResults || {},
      outboundDays: metadata.outboundDays || [],
      inboundDays: metadata.inboundDays || [],
      stopoverCountries: metadata.stopoverCountries || [],
      contextuallyRecommendedFilters: metadata.contextuallyRecommendedFilters || [],
      priceAlertExists: metadata.priceAlertExists || null
    }
  };
}


export default {

  async GetFlights(req, res, next) {

      try {
      const {
        source,
        destination,
        cabinClass,
        currency,
        locale,
        adults,
        children,
        infants,
        handbags,
        holdbags,
        sortBy,
        sortOrder,
        applyMixedClasses,
        allowReturnFromDifferentCity,
        allowChangeInboundDestination,
        allowChangeInboundSource,
        allowDifferentStationConnection,
        enableSelfTransfer,
        allowOvernightStopover,
        enableTrueHiddenCity,
        enableThrowAwayTicketing,
        outbound,
        transportTypes,
        contentProviders,
        priceStart,
        priceEnd,
        maxStops,
        outboundDepartureDateStart,
        outboundDepartureDateEnd,
        inboundDepartureDateStart,
        inboundDepartureDateEnd,
        limit = 20
      } = req.query;



      const page = parseInt(req.query.page) || 1;
      const limitNum = parseInt(limit) || 20;

      console.log(req.query, page, limitNum,666666666)
      const response = await axios.get(
        'https://kiwi-com-cheap-flights.p.rapidapi.com/round-trip',
        {
          headers: {
            'x-rapidapi-host': 'kiwi-com-cheap-flights.p.rapidapi.com',
            'x-rapidapi-key': RAPIDAPI_KEY,
            'Content-Type': 'application/json'
          },

          params: {
            source: source || 'Country:GB',
            destination: destination || 'City:dubrovnik_hr',
            currency: currency || 'usd',
            locale: locale || 'en',
            adults: adults || 1,
            children: children || 0,
            infants: infants || 0,
            handbags: handbags || 1,
            cabinClass: cabinClass || 'ECONOMY',
            sortBy: sortBy || 'QUALITY',
            sortOrder: sortOrder || 'ASCENDING',
            applyMixedClasses: applyMixedClasses || true,
            allowReturnFromDifferentCity: allowReturnFromDifferentCity || true,
            allowChangeInboundDestination: allowChangeInboundDestination || true,
            allowChangeInboundSource: allowChangeInboundSource || true,
            allowDifferentStationConnection: allowDifferentStationConnection || true,
            enableSelfTransfer: enableSelfTransfer || true,
            allowOvernightStopover: allowOvernightStopover || true,
            enableTrueHiddenCity: enableTrueHiddenCity || true,
            enableThrowAwayTicketing: enableThrowAwayTicketing || true,
            outbound: outbound || 'SUNDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,MONDAY,TUESDAY',
            transportTypes: transportTypes || 'FLIGHT',
            contentProviders: 'FLIXBUS_DIRECTS,FRESH,KAYAK,KIWI',
            limit: 100,



          }
        }
      );
      // Format response with pagination
      res.json(formatItinerariesResponse(response.data, page, limitNum));
      // res.json(response.data);
    } catch (err) {
      res.status(500).json({ error: err.response?.data || err.message });
      next(err);
    }

  },







};
