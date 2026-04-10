function pad(value) {
  return String(value).padStart(2, '0');
}

function formatDateForInput(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTimeForInput(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function combineDateAndTime(date, time, fallbackTime) {
  return new Date(`${date}T${time || fallbackTime}:00`);
}

function buildSingleSessionDates(date, isAnytime = false, startTime = '', endTime = '') {
  if (isAnytime) {
    const startAt = new Date();
    startAt.setHours(0, 0, 0, 0);

    const endAt = new Date(startAt);
    endAt.setFullYear(endAt.getFullYear() + 1);
    endAt.setHours(23, 59, 59, 999);

    return {
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
    };
  }

  const startAt = combineDateAndTime(date, startTime, '18:00');
  let endAt = combineDateAndTime(date, endTime, '21:00');

  if (endAt <= startAt) {
    endAt = new Date(startAt.getTime() + 3 * 60 * 60 * 1000);
  }

  return {
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
  };
}

function buildPeriodSessionDates(startDate, endDate) {
  const startAt = new Date(`${startDate}T00:00:00`);
  const endAt = new Date(`${endDate}T23:59:59`);

  return {
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
  };
}

function isAnytimeSession(session) {
  const start = new Date(session?.startAt || '');
  const end = new Date(session?.endAt || '');

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  const diffMs = end.getTime() - start.getTime();
  const minAnytimeDurationMs = 300 * 24 * 60 * 60 * 1000;

  return diffMs >= minAnytimeDurationMs
    && start.getHours() === 0
    && start.getMinutes() === 0
    && end.getHours() === 23
    && end.getMinutes() === 59;
}

function isPeriodSession(session) {
  const start = new Date(session?.startAt || '');
  const end = new Date(session?.endAt || '');

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return false;
  }

  const isAllDayRange = start.getHours() === 0
    && start.getMinutes() === 0
    && end.getHours() === 23
    && end.getMinutes() === 59;

  return isAllDayRange && formatDateForInput(start) !== formatDateForInput(end);
}

function mapSessionsToInitialSchedule(sessions) {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return {
      scheduleMode: 'single',
      singleDate: '',
      singleStartTime: '',
      singleEndTime: '',
      multipleDates: [],
      multipleStartTimes: [],
      multipleEndTimes: [],
      periodStart: '',
      periodEnd: '',
      isAnytime: false,
    };
  }

  if (sessions.length > 1) {
    return {
      scheduleMode: 'multiple',
      singleDate: '',
      singleStartTime: '',
      singleEndTime: '',
      multipleDates: sessions.map((session) => formatDateForInput(session?.startAt)),
      multipleStartTimes: sessions.map((session) => formatTimeForInput(session?.startAt)),
      multipleEndTimes: sessions.map((session) => formatTimeForInput(session?.endAt)),
      periodStart: '',
      periodEnd: '',
      isAnytime: false,
    };
  }

  const session = sessions[0];

  if (isAnytimeSession(session)) {
    return {
      scheduleMode: 'single',
      singleDate: '',
      singleStartTime: '',
      singleEndTime: '',
      multipleDates: [],
      multipleStartTimes: [],
      multipleEndTimes: [],
      periodStart: '',
      periodEnd: '',
      isAnytime: true,
    };
  }

  if (isPeriodSession(session)) {
    return {
      scheduleMode: 'period',
      singleDate: '',
      singleStartTime: '',
      singleEndTime: '',
      multipleDates: [],
      multipleStartTimes: [],
      multipleEndTimes: [],
      periodStart: formatDateForInput(session?.startAt),
      periodEnd: formatDateForInput(session?.endAt),
      isAnytime: false,
    };
  }

  return {
    scheduleMode: 'single',
    singleDate: formatDateForInput(session?.startAt),
    singleStartTime: formatTimeForInput(session?.startAt),
    singleEndTime: formatTimeForInput(session?.endAt),
    multipleDates: [],
    multipleStartTimes: [],
    multipleEndTimes: [],
    periodStart: '',
    periodEnd: '',
    isAnytime: false,
  };
}

function buildSessions(formPayload) {
  if (formPayload.isAnytime) {
    const sessionDates = buildSingleSessionDates('', true);

    return [
      {
        placeId: formPayload.placeId,
        startAt: sessionDates.startAt,
        endAt: sessionDates.endAt,
        price: 0,
      },
    ];
  }

  if (formPayload.scheduleMode === 'multiple') {
    return formPayload.multipleDates.map((date, index) => {
      const sessionDates = buildSingleSessionDates(
        date,
        false,
        formPayload.multipleStartTimes?.[index] || '',
        formPayload.multipleEndTimes?.[index] || '',
      );

      return {
        placeId: formPayload.placeId,
        startAt: sessionDates.startAt,
        endAt: sessionDates.endAt,
        price: 0,
      };
    });
  }

  if (formPayload.scheduleMode === 'period') {
    const sessionDates = buildPeriodSessionDates(formPayload.periodStart, formPayload.periodEnd);

    return [
      {
        placeId: formPayload.placeId,
        startAt: sessionDates.startAt,
        endAt: sessionDates.endAt,
        price: 0,
      },
    ];
  }

  const singleSessionDates = buildSingleSessionDates(
    formPayload.singleDate,
    false,
    formPayload.singleStartTime,
    formPayload.singleEndTime,
  );

  return [
    {
      placeId: formPayload.placeId,
      startAt: singleSessionDates.startAt,
      endAt: singleSessionDates.endAt,
      price: 0,
    },
  ];
}

function mapImageUrls(rawEvent) {
  const images = Array.isArray(rawEvent?.images)
    ? rawEvent.images
      .map((item) => item?.imageUrl || item?.url || '')
      .filter(Boolean)
    : [];

  return images.slice(0, 4);
}

export function mapEventFormPayloadToEventPayload(formPayload) {
  return {
    title: formPayload.title,
    shortDescription: formPayload.locationDescription,
    fullDescription: formPayload.description,
    ageLimit: 0,
    sourceUrl: '',
    categoryIds: formPayload.category ? [formPayload.category] : [],
    tagIds: [],
    imageUrls: [],
    sessions: buildSessions(formPayload),
  };
}

export function mapEventDetailsToInitialValues(rawEvent = {}) {
  const sessions = Array.isArray(rawEvent?.sessions) ? rawEvent.sessions : [];
  const firstSession = sessions[0] || null;
  const categoryIds = Array.isArray(rawEvent?.categoryIds) ? rawEvent.categoryIds : [];
  const categories = Array.isArray(rawEvent?.categories) ? rawEvent.categories : [];
  const tags = Array.isArray(rawEvent?.tags) ? rawEvent.tags : [];
  const schedule = mapSessionsToInitialSchedule(sessions);

  return {
    title: String(rawEvent?.title || '').trim(),
    placeId: String(firstSession?.placeId || firstSession?.place?.id || '').trim(),
    category: String(categories[0]?.id || categoryIds[0] || '').trim(),
    tags: tags.map((tag) => tag?.name || tag?.id || tag).filter(Boolean),
    description: String(rawEvent?.fullDescription || '').trim(),
    locationDescription: String(rawEvent?.shortDescription || '').trim(),
    posterPreviewUrl: String(rawEvent?.coverImageUrl || rawEvent?.imageUrl || '').trim(),
    galleryPreviewUrls: mapImageUrls(rawEvent),
    ...schedule,
  };
}
