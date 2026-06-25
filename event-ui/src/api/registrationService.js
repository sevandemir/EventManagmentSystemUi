import api from "./api";

/**
 * Registration (kayıt/bilet) API servisi.
 * Backend: /api/registrations
 */
export const registrationService = {
    /**
     * Etkinliğe kayıt ol.
     * Rol: ATTENDEE
     */
    register: async (eventId, ticketTierId) => {
        const response = await api.post("/registrations", { eventId, ticketTierId });
        return response.data;
    },

    /**
     * Kaydı iptal et.
     * Rol: ATTENDEE (kendi kaydı)
     */
    cancel: async (registrationId) => {
        await api.delete(`/registrations/${registrationId}`);
    },

    /**
     * QR kod ile check-in.
     * Rol: ORGANIZER, ADMIN
     */
    checkIn: async (qrCode) => {
        const response = await api.post("/registrations/check-in", null, {
            params: { qrCode },
        });
        return response.data;
    },

    /**
     * Güvenli check-in bilet detay sorgulama.
     * Rol: ORGANIZER, ADMIN
     */
    getRegistrationDetailsForCheckIn: async (qrCodeUuid) => {
        const response = await api.get(`/registrations/check-in/details/${qrCodeUuid}`);
        return response.data;
    },

    /**
     * Giriş yapan kullanıcının kayıtları.
     * Rol: ATTENDEE
     */
    getMyRegistrations: async () => {
        const response = await api.get("/registrations/my");
        return response.data;
    },

    /**
     * Bir etkinliğin tüm kayıtları.
     * Rol: ORGANIZER (kendi etkinliği), ADMIN
     */
    getEventRegistrations: async (eventId) => {
        const response = await api.get(`/registrations/event/${eventId}`);
        return response.data;
    },
};
