    import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:9090/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        "Bypass-Tunnel-Reminder": "true",
    },
});

// Request interceptor - token ekle
    api.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem("token");
            // token varsa VE geçerliyse ekle
            if (token && token !== "undefined" && token !== "null") {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

// Response interceptor - 401 yönetimi ve otomatik token yenileme
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Eğer 401 döndüyse ve daha önce token yenilemeyi denemediysek (_retry)
        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/login') {
            originalRequest._retry = true;
            
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
                try {
                    // Axios instance'ı yerine direkt axios kullanalım ki sonsuz döngüye girmeyelim
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken }, {
                        headers: {
                            "ngrok-skip-browser-warning": "true",
                            "Bypass-Tunnel-Reminder": "true"
                        }
                    });
                    
                    const { accessToken, refreshToken: newRefreshToken } = response.data;
                    
                    localStorage.setItem("token", accessToken);
                    localStorage.setItem("refreshToken", newRefreshToken);
                    
                    // Orijinal isteğin header'ını yeni token ile güncelle ve tekrar istek at
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                } catch (refreshError) {
                    // Refresh token da geçersizse logout yap
                    localStorage.removeItem("token");
                    localStorage.removeItem("refreshToken");
                    localStorage.removeItem("user");
                    window.location.href = "/login";
                    return Promise.reject(refreshError);
                }
            } else {
                // Refresh token yoksa mecbur login'e at
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default api;