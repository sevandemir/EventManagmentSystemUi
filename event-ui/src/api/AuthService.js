import api from "./api";
import { jwtDecode } from "jwt-decode";

export const authService = {
    register: async (userData) => {
        const response = await api.post("/auth/register", userData);
        return response.data;
    },

    login: async (identifier, password) => {
        const response = await api.post("/auth/login", { identifier, password });
        const { accessToken, refreshToken } = response.data;

        localStorage.setItem("token", accessToken); // Geriye dönük uyumluluk için token adı aynı kalabilir
        localStorage.setItem("refreshToken", refreshToken);

        // Token'ı decode ederek kullanıcı bilgisini çıkar
        try {
            const decoded = jwtDecode(accessToken);
            const user = {
                id: decoded.sub,
                role: decoded.role || decoded.roles?.[0] || "",
                email: decoded.email || "",
                userName: decoded.userName || "",
            };
            localStorage.setItem("user", JSON.stringify(user));
            return { token: accessToken, user };
        } catch {
            return { token: accessToken, user: null };
        }
    },

    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
    },

    getCurrentUser: () => {
        try {
            const user = localStorage.getItem("user");
            return user ? JSON.parse(user) : null;
        } catch {
            return null;
        }
    },

    getToken: () => localStorage.getItem("token"),

    /**
     * Token var mı VE süresi dolmamış mı?
     * Expire olmuşsa localStorage'ı temizler, false döner.
     */
    isAuthenticated: () => {
        const token = localStorage.getItem("token");
        if (!token) return false;
        try {
            const decoded = jwtDecode(token);
            // exp saniye cinsinden — Date.now() milisaniye
            if (decoded.exp * 1000 < Date.now()) {
                // Token expired → temizle
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                return false;
            }
            return true;
        } catch {
            // Decode edilemiyorsa geçersiz token
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            return false;
        }
    },

    isOrganizer: () => {
        const user = authService.getCurrentUser();
        return user?.role === "ROLE_ORGANIZER" || user?.role === "ORGANIZER";
    },
};