import api from "./api";

export const eventService = {
    // Tüm etkinlikleri getir (summary) - eski, gerekirse kullanılır
    getAllEvents: async () => {
        const response = await api.get("/events");
        return response.data;
    },

    // Arama + filtre + pagination (backend destekli)
    searchEvents: async ({ search, categoryIds, startDate, endDate, location, minPrice, maxPrice, eventType, page = 0, size = 12 } = {}) => {
        const queryParams = new URLSearchParams();
        if (search) queryParams.append("search", search);
        if (categoryIds && categoryIds.length > 0) {
            categoryIds.forEach(id => queryParams.append("categoryIds", id));
        }
        if (location) queryParams.append("location", location);
        if (minPrice !== undefined && minPrice !== "") queryParams.append("minPrice", minPrice);
        if (maxPrice !== undefined && maxPrice !== "") queryParams.append("maxPrice", maxPrice);
        if (eventType) queryParams.append("eventType", eventType);
        if (startDate) queryParams.append("startDate", startDate);
        if (endDate) queryParams.append("endDate", endDate);
        queryParams.append("page", page);
        queryParams.append("size", size);

        const response = await api.get(`/events/search?${queryParams.toString()}`);
        return response.data;
    },

    // Etkinliğin yorumlarını getir
    getEventReviews: async (id) => {
        const response = await api.get(`/events/${id}/reviews`);
        return response.data;
    },

    // Yorum ekle (Attendee)
    addEventReview: async (id, reviewData) => {
        const response = await api.post(`/events/${id}/reviews`, reviewData);
        return response.data;
    },

    // Organizatör puanı getir
    getOrganizerRating: async (organizerId) => {
        const response = await api.get(`/organizers/${organizerId}/rating`);
        return response.data;
    },

    // Organizatörün kendi etkinlikleri
    getMyEvents: async () => {
        const response = await api.get("/events/my-events");
        return response.data;
    },

    // Tek etkinlik detayı
    getEventById: async (id) => {
        const response = await api.get(`/events/${id}`);
        return response.data;
    },

    // Yeni etkinlik oluştur (ORGANIZER)
    createEvent: async (eventData) => {
        const response = await api.post("/events", eventData);
        return response.data;
    },

    // Etkinlik güncelle (ORGANIZER)
    updateEvent: async (id, eventData) => {
        const response = await api.put(`/events/${id}`, eventData);
        return response.data;
    },

    // Etkinlik durumu güncelle (ORGANIZER)
    updateEventStatus: async (id, eventStatus) => {
        const response = await api.patch(`/events/${id}/status`, { eventStatus });
        return response.data;
    },

    // Etkinlik sil (ORGANIZER)
    deleteEvent: async (id) => {
        await api.delete(`/events/${id}`);
    },

    // Etkinlik resmi yükle (ORGANIZER)
    uploadEventImage: async (id, file) => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await api.post(`/events/${id}/image`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },
};